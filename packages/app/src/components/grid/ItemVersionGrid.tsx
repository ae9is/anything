import { DataGridPremium, GridColDef } from '@mui/x-data-grid-premium'
import { queries, useQuery } from '../../data'
import { muiTheme } from '../../lib/theme'
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
          <Box
            sx={{
              // ref: https://mui.com/x/react-data-grid/style/
              '& .actions': {
                color: 'hsl(var(--p))',
              },
              '& .MuiDataGrid-row--editing .MuiDataGrid-cell': {
                backgroundColor: 'unset',
              },
              '& .MuiDataGrid-cell.MuiDataGrid-cell--editing > div > input': {
                color: 'hsl(var(--pc))',
              },
              '& .MuiDataGrid-cell.MuiDataGrid-cell--editing': {
                // backgroundColor: 'hsl(var(--pf) / 0.3)',
              },
              '& .MuiDataGrid-row.Mui-selected': {
                color: 'hsl(var(--pc))',
                backgroundColor: 'hsl(var(--p) / 0.3)',
              },
            }}
          >
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
