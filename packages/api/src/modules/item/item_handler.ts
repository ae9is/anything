import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyEventV2 } from 'aws-lambda'
import { Filter, parse } from 'utils'
import logger from 'logger'
import { middyfy } from '../../lib/middy'
import { changeBatch, changeById, deleteById, getById, getByIdAndQuery } from '../../lib/routing'
import { batchWriteFromJson, putItem, queryItemVersions } from '../../store/store'
import {
  deleteItem as deleteItm,
  upsertItem as upsertItm,
  getItemById,
  getItemsByCollection,
  getItemsByTypeAndFilter,
} from './item.store'

export const itemById = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getById(event, resolveItemById)
})

async function resolveItemById(id: string) {
  return getItemById(id)
}

export const itemVersionsById = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByIdAndQuery(event, resolveItemVersionsById)
})

async function resolveItemVersionsById(id: string, query: any) {
  const startKey = query?.startKey
  const limit = query?.limit
  const asc = query?.asc
  return queryItemVersions(id, startKey, limit, asc)
}

export const itemsByCollection = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getById(event, resolveItemsByCollection)
})

async function resolveItemsByCollection(id: string) {
  return getItemsByCollection(id)
}

export const itemsByTypeAndFilter = middyfy(async (event: APIGatewayProxyEventV2) => {
  logger.debug('Handling itemsByTypeAndFilter...')
  return getByIdAndQuery(event, resolveItemsByTypeAndFilter)
})

async function resolveItemsByTypeAndFilter(type: string, query?: APIGatewayProxyEventQueryStringParameters) {
  logger.debug('Resolving resolveItemsByTypeAndFilter...')
  const attributeNames = query?.attributeNames ? parse(query?.attributeNames) : undefined
  logger.debug('attribute names: ', attributeNames)
  const attributeValues = query?.attributeValues ? parse(query?.attributeValues) : undefined
  logger.debug('attribute values: ', attributeNames)
  const filter: Filter = {
    sortKeyExpression: query?.sortKeyExpression,
    filterExpression: query?.filterExpression,
    attributeNames,
    attributeValues,
  }
  logger.debug('sort key expression: ', filter?.sortKeyExpression)
  logger.debug('filter expression: ', filter?.filterExpression)
  const startKey = query?.startKey
  const limit: number | undefined = Number(query?.limit) || undefined // No NaN, 0
  const asc: boolean | undefined = (query?.asc !== 'false') // Default to true, ascending sort
  return getItemsByTypeAndFilter(type, filter, startKey, limit, asc)
}

export const deleteItem = middyfy(async (event: APIGatewayProxyEventV2) => {
  return deleteById(event, resolveDeleteItem)
})

async function resolveDeleteItem(id: string) {
  return deleteItm(id)
}

export const upsertItem = middyfy(async (event: APIGatewayProxyEventV2) => {
  return changeById(event, resolveUpsertItem)
})

async function resolveUpsertItem(id: string, body: any) {
  return upsertItm(id, body)
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
