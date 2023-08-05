import { describe, expect, test } from '@jest/globals'
import { Filter, parseSearchString, trimQuotes } from './filter'
import logger from 'logger'

function expectDefinedFilter(filter?: Filter) {
  expect(filter).toEqual(expect.objectContaining({
    sortKeyExpression: expect.any(String),
    filterExpression: expect.any(String),
    attributeNames: expect.any(Object),
    attributeValues: expect.any(Object),
  }))
}

describe('filter', () => {
  test('runs a test', () => {
    expect(true)
  })

  test('trims leading/trailing single/double quotes', () => {
    const testString = '"some value\''
    const trimmed = trimQuotes(testString)
    expect(trimmed).toBe('some value')
  })

  test('parses simple search string into filter', () => {
    const searchString = 'type = "shorts" and Price < 1000'
    logger.debug('searchString', searchString)
    const filter = parseSearchString(searchString)
    logger.debug('filter', filter)
    expectDefinedFilter(filter)
    expect(filter?.sortKeyExpression).toBe('v0')
    expect(filter?.filterExpression).toBe('#type = :av1 and #price < :av2')
    expect(filter?.attributeNames).toStrictEqual({
      '#type': 'type',
      '#price': 'Price',
    })
    expect(filter?.attributeValues).toStrictEqual({
      ':av1': 'shorts',
      ':av2': 1000,
    })
  })

  test('parses complex search string into filter', () => {
    const searchString = 'type = "Sweat.pants" and Color in ("blue", "red") and ((Price <= 400 and Price > 200) or (Price BETWEEN 200 AND 400)) ' + 
        'and (attribute_exists(size.width) or attribute_exists(size.length))'
    logger.debug('searchString', searchString)
    const filter = parseSearchString(searchString)
    logger.debug('filter', filter)
    expectDefinedFilter(filter)
    expect(filter?.sortKeyExpression).toBe('v0')
    expect(filter?.filterExpression).toBe('#type = :av1 and #color in (:av2, :av3) and ((#price <= :av4 and #price > :av5) or (#price BETWEEN :av6 AND :av7)) ' + 
        'and (attribute_exists(#size.#width) or attribute_exists(#size.#length))')
    expect(filter?.attributeNames).toStrictEqual({
      '#type': 'type',
      '#color': 'Color',
      '#price': 'Price',
      '#size': 'size',
      '#width': 'width',
      '#length': 'length',
    })
    expect(filter?.attributeValues).toStrictEqual({
      ':av1': 'Sweat.pants',
      ':av2': 'blue',
      ':av3': 'red',
      ':av4': 400,
      ':av5': 200,
      ':av6': 200,
      ':av7': 400,
    })
  })
})
