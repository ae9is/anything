import { useMemo } from 'react'

export function useRowsFromData(data: any) {
  const rows: any[] = useMemo(() => {
    // Transform modified into Date() for data grid to display as date time.
    // Note: We don't bother transforming back elsewhere (for edits), since api will discard the field anyways.
    const items = data?.items
    return (
      items?.map((i: any) => {
        return { ...i, modified: new Date(i?.modified) || new Date() }
      }) || []
    )
  }, [data])
  return rows
}
