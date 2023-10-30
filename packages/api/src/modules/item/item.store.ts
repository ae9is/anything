import _ from 'lodash'
import { gsi1, gsi1Id } from '../../services/dynamodb'
import {
  queryByTypeAndFilter,
  ItemKey,
  getItem,
  batchGet,
  softDeleteItem,
  putItem,
  deleteItem as deleteItm,
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
  // Marks current version with deleted flag, and deletes v0 copy of current
  const metadata = await getItemMetadataById(id)
  const currentVersion = metadata?.currentVersion ?? 0
  const current = {
    id,
    sort: `v${currentVersion}`,
  }
  const v0 = {
    id,
    sort: 'v0',
  }
  await softDeleteItem(current)
  return deleteItm(v0)
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
    ...metadata,
    id,
    sort: '@meta',
  }
  return putItem(item)
}

export const getItemsByTypeAndFilter = async (
  type: any,
  filter?: Filter,
  startKey?: any,
  limit = 50,
  ascendingSortKey = true
) => {
  return queryByTypeAndFilter(type, filter, startKey, gsi1, gsi1Id, limit, ascendingSortKey)
}

export const upsertItem = async (id: string, body: any) => {
  const metadata = await getItemMetadataById(id)
  const currentVersion = metadata?.currentVersion ?? 0
  const newVersion = currentVersion + 1
  await putItem({
    ...body,
    id,
    sort: `v${newVersion}`,
  })
  await putItem({
    ...body,
    id,
    sort: 'v0',
  })
  return setItemMetadataById(id, { ...metadata, currentVersion: newVersion })
}
