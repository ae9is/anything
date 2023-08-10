// prettier-ignore
'use client'

import { queries } from '../../data'
import { LoadingSelect } from './LoadingSelect'

export interface CollectionSelectProps {
  type: string
  value?: string
  onChange?: (newValue?: string) => void
  onLoad?: () => void
}

export function CollectionSelect({
  type,
  value,
  onChange,
  onLoad,
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

  function handleLoad() {
    if (type && value) {
      onLoad?.()
    }
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
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-neutral" type="submit" onClick={handleReset}>
        Reset
      </button>
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit" onClick={handleLoad}>
        Load
      </button>
    </div>
  )
}
