import { useSlug } from '../../../lib/useSlug'
import { withLayout } from '../../../components/layout/withLayout'
import { withAuth } from '../../../components/auth/withAuth'

export default withLayout(function Page() {
  const typeId = useSlug()
  return withAuth(<>TODO - {typeId}</>)
})
