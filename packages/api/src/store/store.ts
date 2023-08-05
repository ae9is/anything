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
import { Filter } from 'utils'
import { ddbClient, ddbDocClient, schema, table, testDataFilePath } from '../services/dynamodb'

// One table schema
export const createSchema = async () => {
  await ddbClient.send(new CreateTableCommand(schema))
  waitUntilTableExists(
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
  waitUntilTableNotExists(
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

export const batchWrite = async (items: Item[], batchSize = 25) => {
  const putRequests = items?.map((item) => ({
    PutRequest: {
      Item: item,
    },
  }))
  const batches = _.chunk(putRequests, batchSize)
  const batchRequests = batches?.map(async (batch, i) => {
    const cmd = new BatchWriteCommand({
      RequestItems: {
        [table]: batch,
      },
    })
    await ddbDocClient.send(cmd).then(() => {
      logger.log(`batch ${i + 1} / ${batches.length} written with ${batch.length} items`)
    })
  })
  await Promise.all(batchRequests)
  return { itemCount: items.length }
}

export const batchGet = async (keys: ItemKey[], batchSize = 50, projectionExpression?: string) => {
  const items: Record<string, any>[] = []
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
    logger.log(`batch ${i + 1} / ${batches.length} retrieved`)
    // TODO handle unretrieved keys
    const unprocessedKeys = output?.UnprocessedKeys
    if (unprocessedKeys && Object.keys(unprocessedKeys)?.length > 0) {
      logger.log(`failed to retrieve ${unprocessedKeys?.length} keys`)
    }
  })
  await Promise.all(batchRequests)
  return { items: items }
}

export const validateItems = (items: any[]) => {
  if (!Array.isArray(items) || items?.length <= 0) {
    throw new Error('Invalid items: ' + items?.slice(0, 100) ?? '' + ' ...')
  }
  // TODO validate each item has id (partition key) and type (attribute) (sort key 'sort' which is date_modified should be autogenerated)
  return items || []
}

export const batchWriteFromJson = async (items: any[]) => {
  const validated = validateItems(items)
  return batchWrite(validated)
}

export const batchWriteFromJsonString = async (data: string) => {
  const items = JSON.parse(data)
  return batchWriteFromJson(items)
}

export const batchWriteFromFile = async (path: string) => {
  const data = fs.readFileSync(path, 'utf8')
  return batchWriteFromJsonString(data)
}

export interface ItemKey {
  id: any
  sort?: any
}

export type Item = ItemKey & {
  [key: string]: any
}
//type Item = Record<string, any>

export const putItem = async (item: Item) => {
  const withDate = { modified: new Date().getTime(), ...item } // Prefer user supplied modification date
  const cmd = new PutCommand({
    TableName: table,
    Item: withDate,
  })
  await ddbDocClient.send(cmd)
  return true
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

export const queryItem = async (key: ItemKey) => {
  const cmd = new QueryCommand({
    TableName: table,
    ExpressionAttributeValues: {
      ':id': key.id,
      ':sort': key?.sort,
    },
    KeyConditionExpression: key?.sort ? 'id = :id and sort = :sort' : 'id = :id', // TODO extend sorting ops
    // FilterExpression: '',
  })
  const resp = await ddbDocClient.send(cmd)
  const items = resp?.Items
  const lastKey = resp?.LastEvaluatedKey
  return { items: items, lastKey: lastKey }
}

export const getItem = async (key: ItemKey) => {
  const cmd = new GetCommand({
    TableName: table,
    Key: key,
  })
  const resp = await ddbDocClient.send(cmd)
  return resp?.Item
}

// TODO could decrypt startKey and encrypt lastKey
export const queryByTypeAndFilter = async (
  type: any,
  filter?: Filter,
  startKey?: any,
  index?: string,
  indexPartitionKey = 'type',
  limit?: number,
  ascendingSortKey?: boolean
) => {
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
    ExclusiveStartKey: startKey,
    Limit: limit,
    ScanIndexForward: ascendingSortKey,
  })
  const resp = await ddbDocClient.send(cmd)
  const items = resp?.Items
  const lastKey = resp?.LastEvaluatedKey
  return { items: items, lastKey: lastKey }
}
