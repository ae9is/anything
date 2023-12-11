import { withLayout } from '../../components/layout/withLayout'
import { withAuth } from '../../components/auth/withAuth'
import { LiveDash } from '../../components/dash/LiveDash'

export default withLayout(function Page() {
  return withAuth(
    <>
      <h1>Live stats dashboard</h1>
      <div className="p-2">
        <LiveDash />
      </div>
    </>
  )
})
