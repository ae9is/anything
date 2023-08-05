import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { createCollection, getCollectionById, getCollectionsByType } from './collection.store'
import { changeById, deleteById, getById, getByIdAndQuery } from '../../lib/routing'
import { deleteCollection as deleteColl } from './collection.store'

export const collectionsByType = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByIdAndQuery(event, resolveCollectionsByType)
})

async function resolveCollectionsByType(type: string, query?: any) {
  const { startKey, limit, asc } = query || {}
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
  const itemIds: [] = body?.itemIds ?? []
  return createCollection(id, itemIds)
}

export const deleteCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return deleteById(event, resolveDeleteCollection)
})

async function resolveDeleteCollection(id: string) {
  return deleteColl(id)
}
