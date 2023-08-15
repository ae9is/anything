import fs from 'fs'
import _ from 'lodash'
import {
  BatchGetCommand,
  BatchGetCommandOutput,
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  CreateTableCommand,
  DeleteTableCommand,
  waitUntilTableExists,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb'
import logger from 'logger'
import { Filter, decodeBase64ToJson, encodeJsonToBase64, notEmpty } from 'utils'
import { ddbClient, ddbDocClient, schema, table, testDataFilePath, typesTable } from '../services/dynamodb'

export interface ItemKey {
  id: any
  sort?: any
}

export type Item = ItemKey & {
  [key: string]: any
}

// One table schema
export const createSchema = async () => {
  await ddbClient.send(new CreateTableCommand(schema))
  return waitUntilTableExists(
    {
      client: ddbClient,
      maxWaitTime: 15,
      maxDelay: 2,
      minDelay: 1,
    },
    {
      TableName: table,
    }
  )
}

export const dropSchema = async () => {
  await ddbClient.send(
    new DeleteTableCommand({
      TableName: table,
    })
  )
  return waitUntilTableNotExists(
    {
      client: ddbClient,
      maxWaitTime: 10,
      maxDelay: 2,
      minDelay: 1,
    },
    {
      TableName: table,
    }
  )
}

export const loadTestData = async () => {
  return batchWriteFromFile(testDataFilePath)
}

export const batchGet = async (keys: ItemKey[], batchSize = 50, projectionExpression?: string) => {
  const items: Record<string, any>[] = []
  let errorCount = 0
  const batches = _.chunk(keys, batchSize)
  const batchRequests = batches?.map(async (batch, i) => {
    const keys = {
      Keys: batch,
      ProjectionExpression: projectionExpression,
    }
    const cmd = new BatchGetCommand({
      RequestItems: {
        [table]: keys,
      },
    })
    const output: BatchGetCommandOutput = await ddbDocClient.send(cmd)
    const responses = output?.Responses || {}
    for (const responseItems of Object.values(responses)) {
      for (const item of responseItems) {
        items.push(item)
      }
    }
    logger.log(`Batch ${i + 1} / ${batches.length} retrieved`)
    const unprocessedKeys = output?.UnprocessedKeys
    // Could also retry fetching keys first, instead of just warning
    if (unprocessedKeys) {
      const numUnprocessed = Object.keys(unprocessedKeys)?.length
      if (numUnprocessed > 0) {
        logger.log(`Failed to retrieve ${unprocessedKeys?.length} keys`)
        errorCount += numUnprocessed
      }
    }
  })
  await Promise.all(batchRequests)
  return { items: items, errorCount }
}

export const batchWriteFromFile = async (path: string) => {
  const data = fs.readFileSync(path, 'utf8')
  return batchWriteFromJsonString(data)
}

export const batchWriteFromJsonString = async (data: string) => {
  const items = JSON.parse(data)
  return batchWriteFromJson(items)
}

export const batchWriteFromJson = async (items: any[]) => {
  return batchWrite(items)
}

export const batchWrite = async (itemsOrCollections: Item[], batchSize = 25) => {
  const [versionedItems, unversionedItems] = validateItems(itemsOrCollections)
  const diff = itemsOrCollections?.length - (versionedItems?.length ?? 0) - (unversionedItems?.length ?? 0)
  if (diff > 0) {
    logger.log(`Warning: ${diff} items did not pass validation`)
  }
  // Versioned database items (like items) need to have their item metadata read to determine current version
  const versionedItemsMetadataKeys: ItemKey[] = versionedItems?.map((item) => {
    return {
      id: item.id,
      sort: '@meta',
    }
  })
  logger.debug(`Fetching metadata for ${versionedItemsMetadataKeys?.length} versioned items ...`)
  const currentVersionedItemsMetadata = await batchGet(versionedItemsMetadataKeys)
  const metadata: Record<string, any> = {}
  currentVersionedItemsMetadata.items?.forEach((itemMeta) => {
    const id = itemMeta.id
    metadata[id] = itemMeta
  })
  // Fill in new metadata version for new versioned items missing it
  versionedItems?.forEach((item) => {
    if (!metadata[item.id]) {
      metadata[item.id] = {
        id: item.id,
        sort: '@meta',
        currentVersion: 0,
      }
    }
  })
  logger.debug('Metadata: ', metadata)
  // Write 3 requests for each versioned item:
  // - Update metadata version
  // - Update current item
  // - Update archived (versioned) copy of item
  const versionedPutRequests = versionedItems?.flatMap((item) => {
    const newVersion = metadata[item?.id]?.currentVersion + 1 ?? 1
    return [
      {
        PutRequest: {
          Item: withDate({...item, sort: 'v0'}),
        },
      },
      {
        PutRequest: {
          Item: withDate({...item, sort: `v${newVersion}`}),
        },
      },
      {
        PutRequest: {
          Item: {...metadata[item.id], currentVersion: newVersion},
        },
      },
    ]
  })
  // Unversioned database items (like collections) just get directly overwritten
  const unversionedPutRequests = unversionedItems?.map((item) => ({
    PutRequest: {
      Item: withDate(item),
    },
  }))
  const batches = _.chunk([...unversionedPutRequests, ...versionedPutRequests], batchSize)
  const batchRequests = batches?.map(async (batch, i) => {
    const cmd = new BatchWriteCommand({
      RequestItems: {
        [table]: batch,
      },
    })
    await ddbDocClient.send(cmd).then(() => {
      logger.log(`Batch ${i + 1} / ${batches.length} written with ${batch.length} items`)
    })
  })
  await Promise.all(batchRequests)
  const validated = [...versionedItems, ...unversionedItems]
  const uniqueTypes = _.uniq(validated?.map((item) => item?.type ?? item?.ctype).filter(notEmpty))
  await putTypes(uniqueTypes, batchSize)
  return { itemCount: validated.length }
}

const validateItems = (items: any[]) => {
  if (!items || !Array.isArray(items) || items?.length <= 0) {
    throw new Error('No valid items')
  }
  const validVersionedItems: Item[] = items?.filter(isValidItem)?.filter(isVersioned) ?? []
  const validUnversionedItems: Item[] = items?.filter(isValidItem)?.filter(i => !isVersioned(i)) ?? []
  return [validVersionedItems, validUnversionedItems]
}

const isVersioned = (item: Item) => {
  return (item?.sort?.match(/v[0-9]+/))
}

const isValidItem = (item: Item) => {
  // Note that "Item" here refers to DynamoDB items, i.e. generic entries in table.
  // This can be: items, item metadata, collections.
  // Validate each collection has:
  // - id
  // - ctype
  // - sort key of @meta
  // - array of item ids
  // Validate each item has:
  // - id
  // - type
  // - sort key of v[0-9]+ (i.e. v0, v1)
  // Validate item metadata has:
  // - id
  // - sort key of @meta
  // - currentVersion
  try {
    if (
      item?.id &&
      ((item.type && item.sort.match(/v[0-9]+/)) || // item
        (item.ctype && item.sort === '@meta' && Array.isArray(item.itemIds)) || // collection
        (item.sort === '@meta' && item?.currentVersion)) // item metadata
    ) {
      logger.debug('Valid item: ', item)
      return true
    }
  } catch {}
  logger.debug('Invalid item: ', item)
  return false
}

const withDate = (item: Item) => {
  const itemWithDate = { ...item, modified: new Date().getTime() }
  return itemWithDate
}

export const getItem = async (key: ItemKey) => {
  const cmd = new GetCommand({
    TableName: table,
    Key: key,
  })
  const resp = await ddbDocClient.send(cmd)
  return resp?.Item
}

export const putItem = async (item: Item) => {
  if (isValidItem(item)) {
    const cmd = new PutCommand({
      TableName: table,
      Item: withDate(item),
    })
    await ddbDocClient.send(cmd)
    item?.type && await putType(item.type)
    return true
  }
  return false
}

export const deleteItem = async (key: ItemKey) => {
  const cmd = new DeleteCommand({
    TableName: table,
    Key: key,
  })
  await ddbDocClient.send(cmd)
  return true
}

export const softDeleteItem = async (key: ItemKey) => {
  const output = await getItem(key)
  const item = output?.Item
  if (!item) {
    logger.log(`softDeleteItem(): Could not find item to delete: ${key?.id}`)
    return false
  }
  const withDelete = { ...item, deleted: true, modified: new Date().getTime() }
  const cmd = new PutCommand({
    TableName: table,
    Item: withDelete,
  })
  await ddbDocClient.send(cmd)
  return true
}

export const queryByTypeAndFilter = async (
  type: any,
  filter?: Filter,
  startKey?: string,
  index?: string,
  indexPartitionKey = 'type',
  limit?: number,
  ascendingSortKey?: boolean
) => {
  const decodedStartKey = decodeKey(startKey)
  const sortKeyExpression = filter?.sortKeyExpression ? ' and ' + filter?.sortKeyExpression : ''
  const keyConditionExpression = '#type = :type' + sortKeyExpression
  logger.debug('keyConditionExpression: ', keyConditionExpression)
  const names = filter?.attributeNames ?? {}
  const values = filter?.attributeValues ?? {}
  // Name of index partition key (i.e. 'type' for gsi1)
  // ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html
  const typeName = { '#type': indexPartitionKey }
  // Value of index partition key
  // ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeValues.html
  const typeValue = type ? { ':type': type } : undefined
  const cmd = new QueryCommand({
    TableName: table,
    IndexName: index,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: {
      ...names,
      ...typeName,
    },
    ExpressionAttributeValues: {
      ...values,
      ...typeValue,
    },
    FilterExpression: filter?.filterExpression,
    ExclusiveStartKey: decodedStartKey,
    Limit: limit,
    ScanIndexForward: ascendingSortKey,
  })
  const resp = await ddbDocClient.send(cmd)
  const items = resp?.Items
  const lastKey = encodeKey(resp?.LastEvaluatedKey)
  return { items: items, lastKey: lastKey }
}

const decodeKey = (key?: string) => {
  if (key) {
    return decodeBase64ToJson(key)
  }
}

const encodeKey = (key?: Record<string, any>) => {
  if (key) {
    return encodeJsonToBase64(key)
  }
}

// Write item type to unique types table
const putType = async (type: string) => {
  const typesCmd = new PutCommand({
    TableName: typesTable,
    Item: { id: type },
  })
  await ddbDocClient.send(typesCmd)
}

const putTypes = async (types: string[], batchSize = 35) => {
  const putRequests = types?.map((type) => ({
    PutRequest: {
      Item: { id: type },
    },
  }))
  const batches = _.chunk(putRequests, batchSize)
  const batchRequests = batches?.map(async (batch, i) => {
    const cmd = new BatchWriteCommand({
      RequestItems: {
        [typesTable]: batch,
      },
    })
    await ddbDocClient.send(cmd).then(() => {
      logger.log(`Batch ${i + 1} / ${batches.length} written with ${batch.length} types`)
    })
  })
  await Promise.all(batchRequests)
}

export const queryItemVersions = async (
  id: string,
  startKey?: string,
  limit?: number,
  ascendingSortKey?: boolean
) => {
  const decodedStartKey = decodeKey(startKey)
  const cmd = new QueryCommand({
    TableName: table,
    ExpressionAttributeNames: {
      "#id": 'id',
      "#sort": 'sort',
    },
    ExpressionAttributeValues: {
      ':id': id,
      ':sort': 'v',
    },
    KeyConditionExpression: '#id = :id and begins_with(#sort, :sort)',
    ExclusiveStartKey: decodedStartKey,
    Limit: limit,
    ScanIndexForward: ascendingSortKey,
  })
  const resp = await ddbDocClient.send(cmd)
  const items = resp?.Items
  const lastKey = encodeKey(resp?.LastEvaluatedKey)
  return { items: items, lastKey: lastKey }
}
