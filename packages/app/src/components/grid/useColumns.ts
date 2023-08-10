import { useMemo } from 'react'
import { GridColDef } from '@mui/x-data-grid-premium'
import { notEmpty } from 'utils'

export function useColumns(rows: any[]) {
  const cols: GridColDef[] = useMemo(() => {
    const idHeader = {
      field: 'id',
    }
    let colNames: string[] = []
    if (rows?.length > 0) {
      colNames = Array.from<string>(
        rows.reduce((acc: Set<string>, item: Record<string, any>) => {
          Object.keys(item)?.forEach((key) => {
            acc.add(key)
          })
          return acc
        }, new Set<string>())
      ).sort()
    }
    let headers: GridColDef[] = colNames
      .map((name) => {
        if (name !== 'id') {
          return {
            field: name,
          }
        }
      })
      .filter(notEmpty)
    return [idHeader, ...headers]
  }, [rows])
  return cols
}
