import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DataGridPremium,
  GridActionsCellItem,
  GridColDef,
  GridPaginationModel,
  GridRowEditStopParams,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridRowSelectionModel,
  MuiBaseEvent,
  MuiEvent,
} from '@mui/x-data-grid-premium'
import { Box, ThemeProvider } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Close'
import { notEmpty } from 'utils'
import logger from 'logger'
import { Query, QueryOptions, invalidate, queries, requestQuery, useConditionalQuery, useMutation } from '../../data'
import { dataGridThemeFixes, muiTheme } from '../../lib/theme'
import { Passthrough } from '../../lib/props'
import { Modal } from '../modal/Modal'
import { useColumns } from './useColumns'
import { useRowsFromData } from './useRowsFromData'
import { Toolbar } from './Toolbar'
import { useRouter } from 'next/navigation'

export interface DataGridProps extends Passthrough {
  query: Query
  queryOpts: QueryOptions
  fallback?: Query
  fallbackOpts?: QueryOptions
  editable?: boolean
  collection?: string
}

// Pagination
// ref: https://mui.com/x/react-data-grid/pagination/#cursor-implementation

// Editing
// ref: https://mui.com/x/react-data-grid/editing/#full-featured-crud

export function DataGrid({
  query,
  queryOpts,
  fallback,
  fallbackOpts,
  editable = false,
  collection,
  ...rest
}: DataGridProps) {
  const ascendingSortKey = true
  const defaultPageSize = 10
  const mapPageToNextCursor = useRef<{ [page: number]: any }>({})
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: defaultPageSize,
  })
  const paginationQueryParams = useMemo(
    () => ({
      startKey: mapPageToNextCursor.current[paginationModel.page - 1],
      limit: paginationModel.pageSize,
      asc: ascendingSortKey,
    }),
    [mapPageToNextCursor, paginationModel, ascendingSortKey]
  )
  logger.debug('Pagination params: ', paginationQueryParams)
  const [rowCount, setRowCount] = useState(Number.MAX_VALUE)

  function onPaginationModelChange(newPaginationModel: GridPaginationModel) {
    // Only change page if we have a cursor for the page, or it's to the first page
    if (newPaginationModel.page === 0 || mapPageToNextCursor.current[newPaginationModel.page - 1]) {
      setPaginationModel(newPaginationModel)
    }
  }

  function withPaginationParams(opts: QueryOptions) {
    const optsQueryParams = opts?.queryParams ?? {}
    const withPaginationQueryParms = { ...optsQueryParams, ...paginationQueryParams }
    return { ...opts, queryParams: withPaginationQueryParms }
  }

  const { data, error, isLoading } = useConditionalQuery(query, withPaginationParams(queryOpts), fallback ?? query, withPaginationParams(fallbackOpts ?? queryOpts))
  const lastKey = data?.lastKey

  const erroredItemCount = useMemo(() => data?.errorCount ?? 0, [data])
  const rows: any[] = useRowsFromData(data)
  const rowCols: GridColDef[] = useColumns(rows, editable)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

  let actionColumn: GridColDef | undefined
  if (editable) {
    actionColumn = {
      field: 'actions',
      type: 'actions',
      headerName: 'ACTIONS',
      headerClassName: 'actions',
      width: 100,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key={`saveAction${id}`}
              icon={<SaveIcon />}
              label="Save"
              onClick={() => onSaveEdit(id)}
              color="primary"
            />,
            <GridActionsCellItem
              key={`cancelAction${id}`}
              icon={<CancelIcon />}
              label="Cancel"
              onClick={() => onCancelEdit(id)}
              color="inherit"
            />,
          ]
        }
        return [
          <GridActionsCellItem
            key={`editAction${id}`}
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEdit(id)}
            color="inherit"
          />,
          <Modal
            key={`deleteAction${id}`}
            modalTitle="Delete Item"
            modalText="Are you sure you want to delete this item?"
            onConfirm={onConfirmDelete}
          >
            <GridActionsCellItem
              //disabled={delIsMutating}
              icon={<DeleteIcon />}
              label="Delete"
              //onClick={() => onDelete(id)}
              color="inherit"
            />
          </Modal>,
        ]
      },
    }
  }
  const cols = actionColumn ? [actionColumn, ...rowCols] : rowCols
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([])

  function onRowSelectionModelChange(newModel: GridRowSelectionModel) {
    setRowSelectionModel(newModel)
  }

  const selectedItemIds = useMemo(() => {
    return (
      rowSelectionModel
        ?.map((rowIdx: any) => (rowIdx as string).split('@')?.[0])
        ?.filter(notEmpty) || []
    )
  }, [rowSelectionModel])
  const first = selectedItemIds?.[0]

  const {
    error: delError,
    trigger: delTrigger,
    isMutating: delIsMutating,
  } = useMutation(queries.deleteItem, { id: first })

  function onEdit(id: GridRowId) {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })
  }

  function onCancelEdit(id: GridRowId) {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    })
  }

  function onSaveEdit(id: GridRowId) {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })
  }

  async function onConfirmDelete() {
    if (first) {
      logger.debug('Deleting item: ', first)
      try {
        await delTrigger()
        if (delError) {
          throw new Error(delError)
        }
        query && invalidate(query, queryOpts)
        fallback && invalidate(fallback, fallbackOpts)
      } catch (e) {
        logger.error('Error deleting item')
        logger.error(e)
      }
    }
  }

  const { trigger: addTrigger, isMutating: addIsMutating } = useMutation(
    queries.addItemsToCollection,
    {
      id: collection,
      body: {
        itemIds: selectedItemIds,
      },
    }
  )

  const { trigger: remTrigger, isMutating: remIsMutating } = useMutation(
    queries.removeItemsFromCollection,
    {
      id: collection,
      body: {
        itemIds: selectedItemIds,
      },
    }
  )

  async function onAddSelectedToCollection() {
    logger.debug(`Adding selected items to collection ${collection}: `, rowSelectionModel)
    try {
      const res = await addTrigger()
    } catch (e) {
      logger.error(`Adding selected items to collection ${collection}: `, rowSelectionModel)
      logger.error(e)
    }
  }

  async function onRemoveSelectedFromCollection() {
    logger.debug(`Removing selected items from collection ${collection}: `, rowSelectionModel)
    try {
      const res = await remTrigger()
    } catch (e) {
      logger.error(`Removing selected items from collection ${collection}: `, rowSelectionModel)
      logger.error(e)
    }
  }

  const router = useRouter()

  function onShowItemVersions() {
    if (first) {
      router.push(`/items/${first}`)
    }
  }

  function onRowModesModelChange(newRowModesModel: GridRowModesModel) {
    setRowModesModel(newRowModesModel)
  }

  function onRowEditStop(params: GridRowEditStopParams<any>, event: MuiEvent<MuiBaseEvent>) {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true
    }
  }

  const [isEditing, setIsEditing] = useState(false)

  async function processRowUpdate(newRow: GridRowModel) {
    setIsEditing(true)
    if (newRow && newRow?.id) {
      logger.debug('Posting item: ', newRow)
      try {
        const res = await requestQuery(queries.postItem, {
          id: newRow.id,
          body: newRow,
        })
        if (!res) {
          throw new Error()
        }
        query && invalidate(query, queryOpts)
        fallback && invalidate(fallback, fallbackOpts)
      } catch (e) {
        logger.error('Error posting item')
        logger.error(e)
      }
      return newRow
    }
    setIsEditing(false)
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
            // Need to defined custom row id because by default data grid will
            //  use and expect any id column to be unique across rows.
            // Here, items should be unique across id and sort key (version).
            // ref: https://mui.com/x/react-data-grid/row-definition/
            getRowId={(row) => row?.id + '@' + row?.sort}
            // The row selection model is just an array of selected row ids,
            //  where row id (from above) is like: item@v0
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={onRowSelectionModelChange}
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
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={onRowModesModelChange}
            onRowEditStop={onRowEditStop}
            processRowUpdate={processRowUpdate}
            slots={{
              toolbar: Toolbar,
            }}
            slotProps={{
              toolbar: {
                hasCollection: !!collection,
                isMutating: addIsMutating || remIsMutating || delIsMutating,
                rowSelectionModel: rowSelectionModel,
                onAddSelectedToCollection,
                onRemoveSelectedFromCollection,
                onShowItemVersions,
              },
            }}
            {...rest}
          />
          {erroredItemCount > 0 && (
            <div className="float-right mt-4 text-error">
              ({erroredItemCount} item{erroredItemCount > 1 ? 's' : ''} couldn&apos;t be retrieved
              and aren&apos;t displayed here)
            </div>
          )}
        </Box>
      )}
    </ThemeProvider>
  )
}
