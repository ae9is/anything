import { useContext } from 'react'
import { UserContext } from './AuthProvider'
import { useRouter } from 'next/router'

export default function AuthRedirect({ children } : { children: React.ReactNode }) {
  const user = useContext(UserContext)
  const router = useRouter()
  if (!user) {
    router.push('/login')
    return <></>
  }
  return children
}
