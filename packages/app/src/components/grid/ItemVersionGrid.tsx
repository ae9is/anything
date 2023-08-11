import { useMemo } from 'react'
import {
  DataGridPremium,
  GridColDef,
} from '@mui/x-data-grid-premium'
import { queries, useQuery } from '../../data'
import { isDefaultThemeActive } from '../../lib/theme'
import { useColumns } from './useColumns'

export interface ItemVersionGridProps {
  id: string
}

export function ItemVersionGrid({
  id,
}: ItemVersionGridProps) {
  const isDefaultTheme = isDefaultThemeActive()
  const { data, error, isLoading } = useQuery(queries.getItemVersions, {id})
  const rows: any[] = useMemo(() => data?.items || [], [data])
  const cols: GridColDef[] = useColumns(rows)

  return (
    <div className="container h-96 max-h-fit">
      {error && <div className="text-error">Error</div>}
      {isLoading && <div className="text">Loading...</div>}
      {!error && !isLoading && (
        <>
          <DataGridPremium
            style={{
              color: isDefaultTheme ? 'white' : 'unset',
            }}
            columns={cols}
            rows={rows}
            loading={isLoading}
            getRowId={(row) => row?.id + '@' + row?.sort}
          />
        </>
      )}
    </div>
  )
}
