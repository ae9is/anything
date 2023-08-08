// prettier-ignore
'use client'

import { useMemo } from 'react'
import { Query, QueryOptions, useQuery } from '../../data'
import { ArraySelect } from './ArraySelect'

export interface LoadingSelectProps {
  query: Query
  queryOptions?: QueryOptions
  queryResultMapper?: (data: any) => any[]
  value?: string
  onChange?: (newValue: string | undefined) => void
}

export function LoadingSelect({
  query,
  queryOptions,
  queryResultMapper,
  value,
  onChange,
}: LoadingSelectProps) {
  const { data, error, isLoading } = useQuery(query, queryOptions)
  let fallback: string | undefined = '...'
  if (error) {
    fallback = 'Error fetching!'
  } else if (isLoading) {
    fallback = 'Loading'
  } else {
    fallback = undefined
  }
  let values = useMemo(() => {
    let newValues: string[] | undefined
    if (queryResultMapper) {
      newValues = data?.items?.map((item: any) => queryResultMapper(item))
    } else {
      newValues = data?.items
    }
    return newValues ?? []
  }, [data, queryResultMapper])

  function handleChange(newValue?: string) {
    onChange?.(newValue)
  }

  return (
    <div className="w-full">
      {fallback && <p>{fallback}</p>}
      {!fallback && <ArraySelect value={value} options={values} onChange={handleChange} />}
    </div>
  )
}
