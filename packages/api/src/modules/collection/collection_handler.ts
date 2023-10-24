import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { deleteCollectionItems, getCollectionById, getCollectionsByType, putCollection, putCollectionItems } from './collection.store'
import { changeById, deleteById, getById, getByIdAndQuery, getPaginationParamsFromQuery } from '../../lib/routing'
import { deleteCollection as deleteColl } from './collection.store'

export const collectionsByType = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByIdAndQuery(event, resolveCollectionsByType)
})

async function resolveCollectionsByType(type: string, query?: APIGatewayProxyEventQueryStringParameters) {
  const { startKey, limit, asc } = getPaginationParamsFromQuery(query)
  return getCollectionsByType(type, startKey, limit, asc)
}

export const collectionById = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getById(event, resolveCollectionById)
})

async function resolveCollectionById(id: string) {
  return getCollectionById(id)
}

export const upsertCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return changeById(event, resolveUpsertCollection)
})

async function resolveUpsertCollection(id: string, body: any) {
  const ctype: string = body?.ctype
  const itemIds: [] = body?.itemIds ?? []
  return putCollection(id, ctype, itemIds)
}

export const deleteCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return deleteById(event, resolveDeleteCollection)
})

async function resolveDeleteCollection(id: string) {
  return deleteColl(id)
}

export const addItemsToCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return changeById(event, resolveAddItemsToCollection)
})

async function resolveAddItemsToCollection(id: string, body: any) {
  const itemIds: [] = body?.itemIds ?? []
  return putCollectionItems(id, itemIds)
}

export const removeItemsFromCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return changeById(event, resolveRemoveItemsFromCollection)
})

async function resolveRemoveItemsFromCollection(id: string, body: any) {
  const itemIds: [] = body?.itemIds ?? []
  return deleteCollectionItems(id, itemIds)
}
