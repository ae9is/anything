import { it, describe, expect } from '@jest/globals'
import _ from 'lodash'
import logger from 'logger'
import { notEmpty } from 'utils'
import { dropSchema, createSchema, loadTestData, putItem } from '../store/store'
import { putCollection, getCollectionsByType } from '../modules/collection/collection.store'
import { getTypes } from '../modules/type/type.store'
import testData from '../data/testData.json'

describe('store', () => {
  it('runs a test', async () => {
    expect(true)
  })

  /*
  // TODO FIXME and rework into set of granular, complete tests
  //  (This file started off as a runscript to quickly seed local DynamoDB with 
  //   values before data seed via serverless plugin was working)
  it('drops and recreates schema, loads data', async () => {
    try {
      logger.log('Dropping schema...')
      const res = await dropSchema()
      expect(res?.state).toBe('SUCCESS')
    } catch (e) {
      logger.log(e)
    }
    logger.log('Creating schema...')
    const res = await createSchema()
    expect(res?.state).toBe('SUCCESS')
    logger.log('Loading test data...')
    const loadRes = await loadTestData()
    expect(loadRes?.itemCount).toBe(testData?.length) // Equal if all data items validated
    logger.log('Adding new item...')
    const item5 = {
      id: 'item5',
      sort: 'v0',
      modified: '1999-01-01-012345',
      author: 'user1',
      type: 'type1',
    }
    const item6 = {
      id: 'item6',
      sort: 'v0',
      modified: '1999-01-02-034500',
      author: 'user1',
      type: 'type2',
    }
    await putItem(item5)
    await putItem(item6)
    logger.log('Adding new collection...')
    const newCollection = {
      id: 'coll1',
      ctype: 'type1',
      itemIds: ['item1', 'item5'],
    }
    await putCollection(newCollection.id, newCollection.ctype, newCollection.itemIds)
    const { items, lastKey } = await getTypes()
    logger.log('Types:')
    const types: string[] = [...new Set(items?.map((i) => i?.type as unknown as string) || [])]
    logger.log(types?.join(','))
    const testDataTypes: string[] = _.uniq(
      testData?.map((item: any) => item?.type ?? item?.ctype).filter(notEmpty)
    )
    expect(types).toEqual(expect.arrayContaining(testDataTypes))
    logger.log('Collections:')
    let collections: any[] = []
    for (const type of types) {
      const collsByType = await getCollectionsByType(type)
      collsByType?.items?.forEach((i) => collections.push(i))
    }
    collections?.forEach((c) => logger.log(`${c?.id}: ${c?.ctype}`))
    const testDataCollections: string[] = _.uniq(
      testData?.map((item: any) => item?.ctype && item?.id).filter(notEmpty)
    )
    expect(collections?.map((c) => c.id) ?? []).toEqual(
      expect.arrayContaining([...testDataCollections, newCollection.id])
    )
  })
  */
})
