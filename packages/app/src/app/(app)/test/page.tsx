// prettier-ignore
'use client'

import logger from 'logger'
import { defaultFilter, stringify } from 'utils'
import { queries, useQuery } from '../../../data'

export default function Page() {
  const query = queries.listItemsByTypeAndFilter
  const opts = {
    id: 'type1',
    queryParams: {
      // TODO FIXME Any string parameter throws 403 forbidden by api gateway
      sortKeyExpression: defaultFilter.sortKeyExpression,
      filterExpression: defaultFilter.filterExpression,
      attributeNames: stringify(defaultFilter.attributeNames),
      attributeValues: stringify(defaultFilter.attributeValues),
      // No sort params works fine
      /*
      sortKeyExpression: undefined,
      filterExpression: undefined,
      attributeNames: undefined,
      attributeValues: undefined,
      */
      asc: true,
      startKey: undefined,
      limit: 10,
    },
  }
  const { data, error, isLoading } = useQuery(query, opts)
  logger.debug('Retrieved data:', data)

  let res
  if (error) {
    res = 'Error fetching!'
  } else if (isLoading) {
    res = 'Loading'
  } else {
    res = (
      data
    )
  }

  const path = '/' + query.path('')
  const method = query.method

  return (
    <>
      <h1>API Test</h1>
      <p>Tests the query listed below.</p>

      <div className="p-2">
        <h3>Query</h3>
        <p>Path: {path}</p>
        <p>Method: {method}</p>
        <p>Options: {stringify(opts)}</p>
        <h3>Result</h3>
        <p>{stringify(res)}</p>
      </div>
    </>
  )
}
