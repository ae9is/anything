import { ItemVersionGrid } from '../../../components/grid/ItemVersionGrid'
import { useSlug } from '../../../lib/useSlug'
import { withLayout } from '../../../components/layout/withLayout'
import { withAuth } from '../../../components/auth/withAuth'

export default withLayout(function Page() {
  const itemId = useSlug()

  if (!itemId)
    return (
      <>
        <h1>Item history</h1>
        <p className="text-error">Error: must specify an item to view history for!</p>
      </>
    )

  return withAuth(
    <>
      <h1>Item history</h1>
      <p>Viewing all item versions for: {itemId}</p>
      <div className="mt-4 p-2">
        <ItemVersionGrid id={itemId} />
      </div>
    </>
  )
})
