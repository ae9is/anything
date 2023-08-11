import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { batchWriteFromJson, putItem } from '../../store/store'
import { Filter, parse } from 'utils'
import { deleteItem as deleteItm, getItemMetadataById, setItemMetadataById } from './item.store'
import { getItemById, getItemsByCollection, getItemsByTypeAndFilter } from './item.store'
import { changeBatch, changeById, deleteById, getById, getByIdAndQuery } from '../../lib/routing'

export const itemById = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getById(event, resolveItemById)
})

async function resolveItemById(id: string) {
  return getItemById(id)
}

export const itemsByCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getById(event, resolveItemsByCollection)
})

async function resolveItemsByCollection(id: string) {
  return getItemsByCollection(id)
}

export const itemsByTypeAndFilter = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByIdAndQuery(event, resolveItemsByTypeAndFilter)
})

async function resolveItemsByTypeAndFilter(type: string, query: any) {
  const attributeNames = query?.attributeNames ? parse(query?.attributeNames) : undefined
  const attributeValues = query?.attributeValues ? parse(query?.attributeValues) : undefined
  const filter: Filter = {
    sortKeyExpression: query?.sortKeyExpression,
    filterExpression: query?.filterExpression,
    attributeNames,
    attributeValues,
  }
  const startKey = query?.startKey
  const limit = query?.limit
  const asc = query?.asc
  return getItemsByTypeAndFilter(type, filter, startKey, limit, asc)
}

export const deleteItem = middyfy(async (event: APIGatewayProxyEventV2) => {
  return deleteById(event, resolveDeleteItem)
})

async function resolveDeleteItem(id: string) {
  // Soft delete, marks v0 with deleted flag
  return deleteItm(id)
}

export const upsertItem = middyfy(async (event: APIGatewayProxyEventV2) => {
  return changeById(event, resolveUpsertItem)
})

async function resolveUpsertItem(id: string, body: any) {
  const metadata = await getItemMetadataById(id)
  const currentVersion = metadata?.currentVersion ?? 0
  const newVersion = currentVersion + 1
  await putItem({
    id,
    sort: `v${newVersion}`,
    ...body,
  })
  await putItem({
    id,
    sort: 'v0',
    ...body,
  })
  return setItemMetadataById(id, {...metadata, currentVersion: newVersion})
}

export const upsertBatchItems = middyfy(async (event: APIGatewayProxyEventV2) => {
  return changeBatch(event, resolveUpsertBatchItems)
})

async function resolveUpsertBatchItems(body: any) {
  // Batch writing any objects into the main table means that the user can use this route to write collections.
  // But to disallow posting collections via /items, could prevalidate here or change batchWriteFromJson to take 
  //  an additional validation function as a parameter.
  return batchWriteFromJson(body)
}
