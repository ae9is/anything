import { useMemo } from 'react'
import { DataGridPremium, GridColDef, GridToolbar } from '@mui/x-data-grid-premium'
import { Filter, defaultFilter, stringify, notEmpty } from 'utils'
import { queries, useConditionalQuery } from '../../data'
import { isDefaultThemeActive } from '../../lib/theme'

export interface DataGridProps {
  collection?: string
  type: string
  filter?: Filter
}

export function DataGrid({
  collection,
  type,
  filter = defaultFilter,
}: DataGridProps) {
  const isDefaultTheme = isDefaultThemeActive()
  const { data, error, isLoading } = useConditionalQuery(
    queries.listItemsByCollection,
    {
      id: collection,
    },
    queries.listItemsByTypeAndFilter,
    {
      id: type,
      queryParams: {
        sortKeyExpression: filter?.sortKeyExpression,
        filterExpression: filter?.filterExpression,
        attributeNames: stringify(filter?.attributeNames),
        attributeValues: stringify(filter?.attributeValues),
      },
    }
  )
  const rows: any[] = useMemo(() => data?.items || [], [data])
  const cols: GridColDef[] = useMemo(() => {
    const idHeader = {
      field: 'id',
    }
    let colNames: string[] = []
    if (rows?.length > 0) {
      colNames = Array.from<string>(
        rows.reduce((acc: Set<string>, item: Record<string, any>) => {
          Object.keys(item)?.forEach((key) => {
            acc.add(key)
          })
          return acc
        }, new Set<string>())
      ).sort()
    }
    let headers: GridColDef[] = colNames
      .map((name) => {
        if (name !== 'id') {
          return {
            field: name,
          }
        }
      })
      .filter(notEmpty)
    return [idHeader, ...headers]
  }, [rows])

  return (
    <div className="container h-96 max-h-fit">
      {error && <div className="text-error">Error</div>}
      {isLoading && <div className="text">Loading...</div>}
      {!error && !isLoading && (
        <DataGridPremium
          style={{
            color: isDefaultTheme ? 'white' : 'unset',
          }}
          columns={cols}
          rows={rows}
          loading={isLoading}
          slots={{
            toolbar: GridToolbar,
          }}
          // Need to defined custom row id because by default data grid will 
          //  use and expect any id column to be unique across rows.
          // Here, items should be unique across id and sort key (version).
          // ref: https://mui.com/x/react-data-grid/row-definition/
          getRowId={(row) => row?.id + row?.sort}
        />
      )}
    </div>
  )
}
