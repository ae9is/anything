// prettier-ignore
'use client'

import { useState } from 'react'
import { TypeSelect, CollectionSelect } from '../../../components/select'
import { DataGrid } from '../../../components/grid/DataGrid'
import { TypeSearchForm } from '../../../components/forms/TypeSearchForm'
import { Filter } from 'utils'

export default function Page() {
  // Browse and search page will be main interface for app.
  // - Types dropdown select and filter adding UI (filters are searches)
  // - Collection dropdown select and item adding UI
  //    (save selected items to collection, remove selected items from collection, load collection, delete collection)
  // - Export data already implemented via mui x-data-grid export feature

  const [type, setType] = useState<string>()
  const [collection, setCollection] = useState<string>()
  const [filter, setFilter] = useState<Filter>()

  function handleChangeType(newValue: string | undefined) {
    if (newValue !== type) {
      // Reset collection on switching types
      setCollection(undefined)
    }
    setType(newValue)
  }

  function handleChangeCollection(newValue: string | undefined) {
    setCollection(newValue)
  }

  function handleSubmitTypeSearchForm(filter?: Filter) {
    setFilter(filter)
  }

  return (
    <>
      <h1>View</h1>
      <p>Query and view data by type and user created collections.</p>

      <div className="p-2">
        <h3>Types</h3>
        <div className="flex flex-col lg:flex-row items-end">
          <TypeSelect value={type} onChange={handleChangeType} />
          <TypeSearchForm
            onSubmit={handleSubmitTypeSearchForm}
          />
        </div>
      </div>

      {type && (
        <div className="p-2">
          <h3>Collections</h3>
          <div className="flex flex-col lg:flex-row items-end">
            <CollectionSelect type={type} value={collection} onChange={handleChangeCollection} />
          </div>
        </div>
      )}

      {type && (
        <div className="mt-16 p-2">
          <DataGrid
            type={type}
            collection={collection}
            filter={filter}
          />
        </div>
      )}
    </>
  )
}
