import { useMemo } from 'react'
import { GridColDef } from '@mui/x-data-grid-premium'
import { notEmpty } from 'utils'

export function useColumns(rows: any[]) {
  const cols: GridColDef[] = useMemo(() => {
    const fixedHeaders = [
      {
        field: 'id',
      },
      {
        field: 'sort',
        width: 50,
      },
      {
        field: 'modified',
        type: 'dateTime',
        width: 180,
      },
    ]
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
        if (name !== 'id' && name !== 'modified' && name !== 'sort') {
          return {
            field: name,
            editable: true,
          }
        }
      })
      .filter(notEmpty)
    return [...fixedHeaders, ...headers]
  }, [rows])
  return cols
}
