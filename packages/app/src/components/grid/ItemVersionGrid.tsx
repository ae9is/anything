import { DataGridPremium, GridColDef } from '@mui/x-data-grid-premium'
import { queries, useQuery } from '../../data'
import { dataGridThemeFixes, muiTheme } from '../../lib/theme'
import { useColumns } from './useColumns'
import { useRowsFromData } from './useRowsFromData'
import { Box, ThemeProvider } from '@mui/material'

export interface ItemVersionGridProps {
  id: string
}

export function ItemVersionGrid({ id }: ItemVersionGridProps) {
  const { data, error, isLoading } = useQuery(queries.getItemVersions, { id })
  const rows: any[] = useRowsFromData(data)
  const cols: GridColDef[] = useColumns(rows, false)

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="container h-96 max-h-fit">
        {error && <div className="text-error">Error</div>}
        {isLoading && <div className="text">Loading...</div>}
        {!error && !isLoading && (
          <Box sx={dataGridThemeFixes}>
            <DataGridPremium
              style={{
                color: 'hsl(var(--bc))',
              }}
              columns={cols}
              rows={rows}
              loading={isLoading}
              getRowId={(row) => row?.id + '@' + row?.sort}
            />
          </Box>
        )}
      </div>
    </ThemeProvider>
  )
}
