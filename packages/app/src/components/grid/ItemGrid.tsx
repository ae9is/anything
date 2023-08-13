import { useMemo, useState } from 'react'
import {
  DataGridPremium,
  GridActionsCellItem,
  GridColDef,
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
import { useRouter } from 'next/navigation'
import { Filter, defaultFilter, stringify, notEmpty } from 'utils'
import logger from 'logger'
import { invalidate, queries, requestQuery, useConditionalQuery, useMutation } from '../../data'
import { muiTheme } from '../../lib/theme'
import { Modal } from '../modal/Modal'
import { Toolbar } from './Toolbar'
import { useColumns } from './useColumns'
import { useRowsFromData } from './useRowsFromData'

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
  }
  const fallback = queries.listItemsByTypeAndFilter
  const fallbackOpts = {
    id: type,
    queryParams: {
      sortKeyExpression: filter?.sortKeyExpression,
      filterExpression: filter?.filterExpression,
      attributeNames: stringify(filter?.attributeNames),
      attributeValues: stringify(filter?.attributeValues),
    },
  }
  const { data, error, isLoading } = useConditionalQuery(query, queryOpts, fallback, fallbackOpts)
  const erroredItemCount = useMemo(() => data?.errorCount ?? 0, [data])
  const rows: any[] = useRowsFromData(data)
  const rowCols: GridColDef[] = useColumns(rows)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})
  // ref: https://mui.com/x/react-data-grid/editing/#full-featured-crud
  const actionColumn: GridColDef = {
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
        </Modal>
        ,
      ]
    },
  }
  const cols = [actionColumn, ...rowCols]
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
    trigger: addTrigger,
    isMutating: addIsMutating,
  } = useMutation(queries.addItemsToCollection, {
    id: collection,
    body: {
      itemIds: selectedItemIds,
    },
  })

  const {
    trigger: remTrigger,
    isMutating: remIsMutating,
  } = useMutation(queries.removeItemsFromCollection, {
    id: collection,
    body: {
      itemIds: selectedItemIds,
    },
  })

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

  const {
    error: delError,
    trigger: delTrigger,
    isMutating: delIsMutating,
  } = useMutation(queries.deleteItem, { id: first })

  function onEdit(id: GridRowId) {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit }})
  }

  function onCancelEdit(id: GridRowId) {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true }})
  }

  function onSaveEdit(id: GridRowId) {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View }})
  }

  async function onConfirmDelete() {
    if (first) {
      logger.debug('Deleting item: ', first)
      try {
        await delTrigger()
        if (delError) {
          throw new Error(delError)
        }
        invalidate(query, queryOpts)
        invalidate(fallback, fallbackOpts)
      } catch (e) {
        logger.error('Error deleting collection')
        logger.error(e)
      }
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
        invalidate(query, queryOpts)
        invalidate(fallback, fallbackOpts)
      } catch (e) {
        logger.error('Error posting item')
        logger.error(e)
      }
      return newRow
    }
    setIsEditing(false)
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="container h-96 max-h-fit">
        {error && <div className="text-error">Error</div>}
        {isLoading && <div className="text">Loading...</div>}
        {!error && !isLoading && (
          <Box sx={{
            // ref: https://mui.com/x/react-data-grid/style/
            // Unfortunately need to set custom styling for data grid even with MUI theme specified.
            // Selectors have added specificity just to beat out conflicting MUI styling.
            '& .actions': {
              color: 'hsl(var(--p))',
            },
            '& .MuiDataGrid-row > .MuiDataGrid-cell': {
              color: 'hsl(var(--bc))',
              backgroundColor: 'unset',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.Mui-selected': {
              color: 'hsl(var(--pc))',
              backgroundColor: 'hsl(var(--p) / 0.3)',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.Mui-selected:hover': {
              backgroundColor: 'hsl(var(--pf) / 0.3)',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.MuiDataGrid-row--editing': {
              color: 'hsl(var(--nc))',
              backgroundColor: 'hsl(var(--n))',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.MuiDataGrid-row--editing.Mui-selected': {
              backgroundColor: 'hsl(var(--nf) / 0.8)',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.MuiDataGrid-row--editing.Mui-selected:hover': {
              backgroundColor: 'hsl(var(--nf))',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable:hover': {
              color: 'hsl(var(--pc))',
              backgroundColor: 'hsl(var(--pf) / 0.1)',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.MuiDataGrid-row--editing input': {
              color: 'hsl(var(--nc))',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.MuiDataGrid-row--editing.Mui-selected input': {
              backgroundColor: 'unset',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editable.MuiDataGrid-row--editing.Mui-selected > div': {
              backgroundColor: 'unset',
            },
            '& .MuiDataGrid-cell.MuiDataGrid-cell--editing': {
              backgroundColor: 'unset',
            },
          }}>
            <DataGridPremium
              style={{
                color: 'hsl(var(--bc))',
              }}
              columns={cols}
              rows={rows}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowModesModelChange={onRowModesModelChange}
              onRowEditStop={onRowEditStop}
              processRowUpdate={processRowUpdate}
              loading={isLoading}
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
              // Need to defined custom row id because by default data grid will
              //  use and expect any id column to be unique across rows.
              // Here, items should be unique across id and sort key (version).
              // ref: https://mui.com/x/react-data-grid/row-definition/
              getRowId={(row) => row?.id + '@' + row?.sort}
              // The row selection model is just an array of selected row ids,
              //  where row id (from above) is like: item@v0
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={onRowSelectionModelChange}
            />
            {erroredItemCount > 0 && (
              <div className="float-right mt-4 text-error">
                ({erroredItemCount} item{erroredItemCount > 1 ? 's' : ''} couldn&apos;t be retrieved
                and aren&apos;t displayed here)
              </div>
            )}
          </Box>
        )}
      </div>
    </ThemeProvider>
  )
}
