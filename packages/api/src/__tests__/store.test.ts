//import { describe, it, expect } from 'jest'
import logger from 'logger'
import { dropSchema, createSchema, loadTestData, putItem } from '../store/store'
import { createCollection, getCollectionsByType } from '../modules/collection/collection.store'
import { getTypes } from '../modules/type/type.store'

export const run = async () => {
  try {
    logger.log('Dropping schema...')
    await dropSchema()
  } catch (e) {
    logger.log(e)
  }
  logger.log('Creating schema...')
  await createSchema()
  logger.log('Loading test data...')
  await loadTestData()
  logger.log('Adding new item...')
  await putItem({
    id: 'item5',
    sort: 'v0',
    modified: '1999-01-01-012345',
    author: 'user1',
    type: 'type1',
  })
  await putItem({
    id: 'item6',
    sort: 'v0',
    modified: '1999-01-02-034500',
    author: 'user1',
    type: 'type2',
  })
  logger.log('Adding new collection...')
  await createCollection('coll1', ['item1', 'item5'])
  const { items, lastKey } = await getTypes()
  logger.log('Types:')
  const types: string[] = [...new Set(items?.map((i) => i?.type as unknown as string) || [])]
  logger.log(types?.join(','))
  logger.log('Collections:')
  let collections: any[] = []
  for (const type of types) {
    const collsByType = await getCollectionsByType(type)
    collsByType?.items?.forEach((i) => collections.push(i))
  }
  collections?.forEach((c) => logger.log(`${c?.id}: ${c?.ctype}`))
  logger.log('Done')
}

run()
