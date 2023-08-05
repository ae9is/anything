// prettier-ignore
'use client'

import { queries } from '../../data'
import { LoadingSelect } from './LoadingSelect'

export interface CollectionSelectProps {
  type: string
  value?: string
  onChange?: (newValue?: string) => void
}

export function CollectionSelect({
  type,
  value,
  onChange,
}: CollectionSelectProps) {
  function queryResultMapper(collectionInfo: any) {
    return collectionInfo?.id
  }

  function handleReset() {
    onChange?.(undefined)
  }

  function handleChange(newValue?: string) {
    onChange?.(newValue)
  }

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-end">
      <LoadingSelect
        query={queries.listCollections}
        queryOptions={{ id: type }}
        queryResultMapper={queryResultMapper}
        value={value}
        onChange={handleChange}
      />
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit" onClick={handleReset}>
        Reset
      </button>
    </div>
  )
}
