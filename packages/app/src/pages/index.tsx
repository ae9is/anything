import { withLayout } from '../components/layout/withLayout'
import { withAuth } from '../components/auth/withAuth'
import App from './app'
 
export default withLayout(function Page() {
  return withAuth(<App />)
})
