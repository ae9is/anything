import { Filter, defaultFilter, stringify } from 'utils'
import { queries } from '../../data'
import { DataGrid } from './DataGrid'

export interface ItemGridProps {
  loadCollection?: boolean
  collection?: string
  type: string
  filter?: Filter
}

export function ItemGrid({
  loadCollection,
  collection,
  type,
  filter = defaultFilter,
}: ItemGridProps) {
  const query = queries.listItemsByCollection
  const queryOpts = {
    id: loadCollection ? collection : undefined,
    queryParams: {
      asc: true,
      startKey: undefined,
      limit: 10,
    },
  }
  const fallback = queries.listItemsByTypeAndFilter
  const fallbackOpts = {
    id: type,
    queryParams: {
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

  return (
    <DataGrid
      query={query}
      queryOpts={queryOpts}
      fallback={fallback}
      fallbackOpts={fallbackOpts}
      collection={collection}
    />
  )
}
