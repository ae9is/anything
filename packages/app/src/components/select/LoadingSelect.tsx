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
  newOptionsAllowed?: boolean
  isCreatingNewOption?: boolean
  onCreateOption?: (newValue?: string) => void
}

export function LoadingSelect({
  query,
  queryOptions,
  queryResultMapper,
  value,
  onChange,
  newOptionsAllowed,
  isCreatingNewOption,
  onCreateOption,
}: LoadingSelectProps) {
  const { data, error, isLoading } = useQuery(query, queryOptions)
  let fallback: React.ReactNode
  if (error) {
    fallback = <p className="error">Error fetching options</p>
  } else if (isLoading) {
    fallback = <p className="info">Loading options...</p>
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
      {fallback && fallback}
      {!fallback && (
        <ArraySelect
          value={value}
          options={values}
          onChange={handleChange}
          newOptionsAllowed={newOptionsAllowed}
          isCreatingNewOption={isCreatingNewOption}
          onCreateOption={onCreateOption}
        />
      )}
    </div>
  )
}
