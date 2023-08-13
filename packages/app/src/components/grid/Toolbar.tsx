import { useState } from 'react'
import { Button, Menu, MenuItem } from '@mui/material'
import { GridRowSelectionModel, GridToolbar, GridToolbarContainer } from '@mui/x-data-grid-premium'
import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import IsoIcon from '@mui/icons-material/Iso'

export interface ToolbarProps {
  hasCollection: boolean
  isMutating: boolean
  rowSelectionModel: GridRowSelectionModel
  onAddSelectedToCollection?: () => void
  onRemoveSelectedFromCollection?: () => void
  onShowItemVersions?: () => void
}

// ref: https://stackoverflow.com/a/73763021
export function Toolbar({
  hasCollection,
  isMutating,
  rowSelectionModel,
  onAddSelectedToCollection,
  onRemoveSelectedFromCollection,
  onShowItemVersions,
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

  function handleShowVersions() {
    onShowItemVersions?.()
  }

  return (
    <GridToolbarContainer>
      <GridToolbar />
      <GridToolbarContainer>
        <Button
          size="small"
          disabled={rowSelectionModel?.length !== 1}
          startIcon={<HistoryIcon />}
          onClick={handleShowVersions}
        >
          Versions
        </Button>
        <Button
          size="small"
          disabled={!hasCollection || isMutating || rowSelectionModel?.length === 0}
          startIcon={<IsoIcon />}
          onClick={(event) => {
            setAnchor(event.currentTarget)
          }}
        >
          Collection
        </Button>
        <Menu
          id="collectionMenu"
          anchorEl={anchor}
          open={open}
          onClose={() => {
            setAnchor(undefined)
          }}
        >
          <MenuItem onClick={handleAdd}>
            <AddIcon /> Add selected
          </MenuItem>
          <MenuItem onClick={handleRemove}>
            <RemoveIcon /> Remove selected
          </MenuItem>
        </Menu>
      </GridToolbarContainer>
    </GridToolbarContainer>
  )
}
