import { Link } from '../components'
import { useContext } from 'react'
import { UserAttrContext } from '../components/auth/AuthProvider'

export default function Page() {
  const userAttr = useContext<any>(UserAttrContext)

  const welcome = (
    <div className="flex flex-col prose container mx-auto text-center justify-center items-center p-24 gap-10">
      <p>Welcome, {userAttr?.displayName || 'Guest'}!</p>
      <Link href="/view">View data</Link>
      <Link href="/import">Import data</Link>
      <Link href="/stats">Stats</Link>
    </div>
  )

  return (
    <>
      {userAttr && welcome}
    </>
  )
}
