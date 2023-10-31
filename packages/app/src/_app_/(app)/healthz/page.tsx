// prettier-ignore
'use client'

import logger from 'logger'
import { queries, useQuery } from '../../../data'

export default function Page() {
  const query = queries.healthz
  const { data, error, isLoading } = useQuery(query)
  logger.debug('healthz data:', data)
  let healthz = 'error'
  if (data === true) {
    healthz = 'true'
  } else if (data === false) {
    healthz = 'false'
  }

  let res
  if (error) {
    res = 'Error fetching!'
  } else if (isLoading) {
    res = 'Loading'
  } else {
    res = healthz
  }

  const path = '/' + query.path('')
  const method = query.method

  return (
    <>
      <h1>API Health Check</h1>
      <p>Test querying an API health check endpoint.</p>

      <div className="p-2">
        <h3>Query</h3>
        <p>Path: {path}</p>
        <p>Method: {method}</p>
        <h3>Result</h3>
        <p>{res}</p>
      </div>
    </>
  )
}
