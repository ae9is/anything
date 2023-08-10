import _ from 'lodash'
import { gsi2, gsi2Id } from '../../services/dynamodb'
import { Item, deleteItem, getItem, putItem, queryByTypeAndFilter } from '../../store/store'
import logger from 'logger'

export const putCollection = async (id: string, ctype: string, itemIds: string[] = []) => {
  const item: Item = {
    id,
    sort: '@meta',
    ctype,
    itemIds,
  }
  return putItem(item)
}

export const getCollectionsByType = async (
  type: any,
  startKey?: any,
  limit = 100,
  ascendingSortKey = true
) => {
  return queryByTypeAndFilter(type, undefined, startKey, gsi2, gsi2Id, limit, ascendingSortKey)
}

const getCollectionKey = (id: string) => {
  return {
    id,
    sort: '@meta',
  }
}

export const getCollectionById = async (id: string) => {
  const key = getCollectionKey(id)
  return getItem(key)
}

export const deleteCollection = async (id: string) => {
  const key = getCollectionKey(id)
  return deleteItem(key)
}

const changeCollectionItems = async (id: string, itemIds: string[], removeIds = false) => {
  const key = getCollectionKey(id)
  const collection = await getItem(key)
  const collectionItems: string[] = collection?.itemIds ?? []
  let updatedIds: string[]
  if (removeIds) {
    updatedIds = collectionItems?.filter((id) => !itemIds?.includes(id)) ?? []
  } else {
    updatedIds = _.uniq([...collectionItems, ...itemIds])
  }
  const updated = { ...collection, itemIds: updatedIds, ...key }
  logger.debug('Updated collection: ', updated)
  return putItem(updated)
}

export const putCollectionItems = async (id: string, itemIds: string[]) => {
  return changeCollectionItems(id, itemIds)
}

export const deleteCollectionItems = async (id: string, itemIds: string[]) => {
  return changeCollectionItems(id, itemIds, true)
}
