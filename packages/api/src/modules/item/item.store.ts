import _ from 'lodash'
import { gsi1, gsi1Id } from '../../services/dynamodb'
import {
  queryByTypeAndFilter,
  ItemKey,
  getItem,
  batchGet,
  softDeleteItem,
  putItem,
} from '../../store/store'
import { Filter } from 'utils'
import { getCollectionById } from '../collection/collection.store'

export const getItemsByCollection = async (collectionId: string) => {
  const collection = await getCollectionById(collectionId)
  const itemIds: string[] = collection?.itemIds || []
  const keys: ItemKey[] = itemIds?.map((id) => {
    return {
      id,
      sort: 'v0',
    }
  })
  return (keys && batchGet(keys)) || []
}

export const deleteItem = async (id: string) => {
  const item = {
    id: id,
    sort: 'v0',
  }
  return softDeleteItem(item)
}

export const getItemById = async (id: string) => {
  const key: ItemKey = {
    id,
    sort: 'v0',
  }
  return getItem(key)
}

export const getItemMetadataById = async (id: string) => {
  const key: ItemKey = {
    id,
    sort: '@meta',
  }
  return getItem(key)
}

export const setItemMetadataById = async (id: string, metadata: any) => {
  const item = {
    id,
    sort: '@meta',
    body: metadata,
  }
  return putItem(item)
}

export const getItemsByTypeAndFilter = async (
  type: any,
  filter?: Filter,
  startKey?: any,
  limit = 50,
  ascendingSortKey = false
) => {
  return queryByTypeAndFilter(type, filter, startKey, gsi1, gsi1Id, limit, ascendingSortKey)
}
