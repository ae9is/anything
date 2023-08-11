import { useMemo, useState } from 'react'
import {
  DataGridPremium,
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid-premium'
import { Filter, defaultFilter, stringify, notEmpty } from 'utils'
import { queries, useConditionalQuery, useMutation } from '../../data'
import { isDefaultThemeActive } from '../../lib/theme'
import { Toolbar } from './Toolbar'
import logger from 'logger'
import { useColumns } from './useColumns'

export interface DataGridProps {
  loadCollection?: boolean
  collection?: string
  type: string
  filter?: Filter
}

export function DataGrid({
  loadCollection,
  collection,
  type,
  filter = defaultFilter,
}: DataGridProps) {
  const isDefaultTheme = isDefaultThemeActive()
  const { data, error, isLoading } = useConditionalQuery(
    queries.listItemsByCollection,
    {
      id: loadCollection ? collection : undefined,
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
  const erroredItemCount = useMemo(() => data?.errorCount ?? 0, [data])
  const rows: any[] = useMemo(() => data?.items || [], [data])
  const cols: GridColDef[] = useColumns(rows)

  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([])

  function onRowSelectionModelChange(newModel: GridRowSelectionModel) {
    setRowSelectionModel(newModel)
  }

  const selectedItemIds = useMemo(() => {
    return rowSelectionModel?.map((rowIdx: any) => (rowIdx as string).split('@')?.[0])?.filter(notEmpty) || []
  }, [rowSelectionModel])

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

  const {
    data: addData,
    error: addError,
    trigger: addTrigger,
    reset: addReset,
    isMutating: addIsMutating,
  } = useMutation(queries.addItemsToCollection, {
    id: collection,
    body: {
      itemIds: selectedItemIds,
    },
  })

  const {
    data: remData,
    error: remError,
    trigger: remTrigger,
    reset: remReset,
    isMutating: remIsMutating,
  } = useMutation(queries.removeItemsFromCollection, {
    id: collection,
    body: {
      itemIds: selectedItemIds,
    },
  })

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
            slots={{
              toolbar: Toolbar,
            }}
            slotProps={{
              toolbar: {
                hasCollection: !!collection,
                isMutating: addIsMutating || remIsMutating,
                rowSelectionModel: rowSelectionModel,
                onAddSelectedToCollection,
                onRemoveSelectedFromCollection,
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
        </>
      )}
    </div>
  )
}
