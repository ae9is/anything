import { useEffect, useMemo, useRef, useState } from 'react'
import { DataGridPremium, GridColDef, GridPaginationModel } from '@mui/x-data-grid-premium'
import { Box, ThemeProvider } from '@mui/material'
import logger from 'logger'
import { queries, useQuery } from '../../data'
import { dataGridThemeFixes, muiTheme } from '../../lib/theme'
import { useColumns } from './useColumns'
import { useRowsFromData } from './useRowsFromData'

export interface ItemVersionGridProps {
  id: string
}

export function ItemVersionGrid({ id }: ItemVersionGridProps) {
  const ascendingSortKey = true
  const defaultPageSize = 3 //10
  const mapPageToNextCursor = useRef<{ [page: number]: any }>({})
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: defaultPageSize,
  })
  const queryParams = useMemo(
    () => ({
      startKey: mapPageToNextCursor.current[paginationModel.page - 1],
      limit: paginationModel.pageSize,
      asc: ascendingSortKey,
    }),
    [mapPageToNextCursor, paginationModel, ascendingSortKey]
  )
  logger.debug('query params: ', queryParams)
  const { data, error, isLoading } = useQuery(queries.getItemVersions, {
    id,
    queryParams: queryParams,
  })
  const rows: any[] = useRowsFromData(data)
  const cols: GridColDef[] = useColumns(rows, false)
  const lastKey = data?.lastKey
  logger.debug('lastKey: ', lastKey)
  const [rowCount, setRowCount] = useState(Number.MAX_VALUE)

  function onPaginationModelChange(newPaginationModel: GridPaginationModel) {
    // Only change page if we have a cursor for the page, or it's to the first page
    logger.debug('newPaginationModel: ', newPaginationModel)
    if (newPaginationModel.page === 0 || mapPageToNextCursor.current[newPaginationModel.page - 1]) {
      setPaginationModel(newPaginationModel)
    }
  }

  useEffect(() => {
    if (!isLoading) {
      if (lastKey) {
        // We have another cursor, add it to our map of page to cursor
        mapPageToNextCursor.current[paginationModel.page] = lastKey
        logger.debug('Set next cursor: ', lastKey)
        logger.debug('Page: ', paginationModel.page)
        logger.debug(mapPageToNextCursor.current)
      } else {
        // No more cursors, calculate and set total row count
        logger.debug('Reached last page')
        const totalNumRows = paginationModel.page * paginationModel.pageSize + rows?.length || 0
        setRowCount(totalNumRows)
      }
    }
  }, [paginationModel, isLoading, lastKey, rows?.length])

  function getPaginationRowLabels({ from, to, count, }: { from: number, to: number, count: number }) {
    if (count === Number.MAX_VALUE) {
      return `Rows ${from} - ${to}`
    }
    return `${from} - ${to} of ${count}`
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="container h-96 max-h-fit">
        {error && <div className="text-error">Error loading data</div>}
        {isLoading && <div className="text">Loading...</div>}
        {!error && !isLoading && (
          <Box>
            <DataGridPremium
              sx={dataGridThemeFixes}
              getRowClassName={(params) => 'custom-row-theme'}
              columns={cols}
              rows={rows}
              loading={isLoading}
              getRowId={(row) => row?.id + '@' + row?.sort}
              pagination
              paginationMode="server"
              rowCount={rowCount}
              pageSizeOptions={[5, defaultPageSize, 25, 50, 100]}
              onPaginationModelChange={onPaginationModelChange}
              paginationModel={paginationModel}
              localeText={{
                MuiTablePagination: {
                  labelDisplayedRows: getPaginationRowLabels,
                },
              }}
            />
          </Box>
        )}
      </div>
    </ThemeProvider>
  )
}
