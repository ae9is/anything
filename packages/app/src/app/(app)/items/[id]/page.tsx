// prettier-ignore
'use client'

import { ItemVersionGrid } from "../../../../components/grid/ItemVersionGrid"

export default function Page({ params }: { params: { id: string } }) {
  const itemId = params.id

  if (!itemId) return (
    <>
      <h1>Item history</h1>
      <p className="text-error">Error: must specify an item to view history for!</p>
    </>
  )

  return (
    <>
      <h1>Item history</h1>
      <p>Viewing all item versions for: {itemId}</p>
      <div className="mt-4 p-2">
        <ItemVersionGrid id={itemId} />
      </div>
    </>
  )
}
