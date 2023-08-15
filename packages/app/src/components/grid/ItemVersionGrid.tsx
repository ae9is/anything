import { queries } from '../../data'
import { DataGrid } from './DataGrid'

export interface ItemVersionGridProps {
  id: string
}

export function ItemVersionGrid({ id }: ItemVersionGridProps) {
  return (
    <DataGrid
      query={queries.getItemVersions}
      queryOpts={{
        id,
      }}
    />
  )
}
