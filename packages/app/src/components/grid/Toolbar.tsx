import { Button, Menu, MenuItem } from '@mui/material'
import {
  GridRowSelectionModel,
  GridToolbar,
  GridToolbarContainer,
} from '@mui/x-data-grid-premium'
import { useState } from 'react'

export interface ToolbarProps {
  hasCollection: boolean
  isMutating: boolean
  rowSelectionModel: GridRowSelectionModel
  onAddSelectedToCollection?: () => void
  onRemoveSelectedFromCollection?: () => void
}

// ref: https://stackoverflow.com/a/73763021
export function Toolbar({
  hasCollection,
  isMutating,
  rowSelectionModel,
  onAddSelectedToCollection,
  onRemoveSelectedFromCollection,
}: ToolbarProps) {
  const [anchor, setAnchor] = useState<HTMLButtonElement>()
  const open = Boolean(anchor)

  function handleAdd() {
    onAddSelectedToCollection?.()
    setAnchor(undefined)
  }

  function handleRemove() {
    onRemoveSelectedFromCollection?.()
    setAnchor(undefined)
  }

  return (
    <GridToolbarContainer>
      <GridToolbar />
      {/*
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      */}
      <GridToolbarContainer>
        <Button
          size="small"
          disabled={!hasCollection || isMutating || rowSelectionModel?.length === 0}
          //startIcon={<Todo />}
          onClick={(event) => {
            setAnchor(event.currentTarget)
          }}
        >
          +/- Collection
        </Button>
        <Menu
          id="collectionMenu"
          anchorEl={anchor}
          open={open}
          onClose={() => {
            setAnchor(undefined)
          }}
        >
          <MenuItem onClick={handleAdd}>+ Add selected</MenuItem>
          <MenuItem onClick={handleRemove}>- Remove selected</MenuItem>
        </Menu>
      </GridToolbarContainer>
    </GridToolbarContainer>
  )
}
