import { gsi2, gsi2Id } from '../../services/dynamodb'
import { Item, deleteItem, getItem, putItem, queryByTypeAndFilter } from '../../store/store'

export const createCollection = async (collectionId: string, itemIds: string[]) => {
  const item: Item = {
    id: collectionId,
    itemIds: itemIds,
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

export const getCollectionById = async (id: string) => {
  const key = {
    id: id,
    sort: '@meta',
  }
  return getItem(key)
}

export const deleteCollection = async (id: string) => {
  const key = {
    id: id,
  }
  return deleteItem(key)
}
