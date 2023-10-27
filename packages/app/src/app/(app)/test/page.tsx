// prettier-ignore
'use client'

import logger from 'logger'
import { defaultFilter, stringify } from 'utils'
import { queries, useQuery } from '../../../data'

export default function Page() {
  const query = queries.listItemsByTypeAndFilter
  const opts = {
    id: 'type2',
    queryParams: {
      // Note: with HTTP APIs, setting string query parameters results in 403 Forbidden 
      //  when secured with IAM auth (request signing mismatch).
      //  Boolean and number query parameters are OK.
      //  Simple string query parameters can be used with REST APIs with IAM.
      //  More complicated string query params need to be POSTed to an endpoint.
      asc: true,
      startKey: undefined,
      limit: 10,
    },
    body: {
      sortKeyExpression: defaultFilter.sortKeyExpression,
      filterExpression: defaultFilter.filterExpression,
      attributeNames: defaultFilter.attributeNames,
      attributeValues: defaultFilter.attributeValues,
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
