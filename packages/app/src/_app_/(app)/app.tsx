// prettier-ignore
'use client'

import { Link } from '../../components'
import { useContext } from 'react'
import { UserAttrContext } from '../(auth)/provider'
import { QuickSightDash } from '../../components/dash/QuicksightDash'
import AppLayout from './layout'

export default function App() {
  const userAttr = useContext<any>(UserAttrContext)

  const welcome = (
    <div className="flex flex-col prose container mx-auto text-center justify-center items-center p-24 gap-10">
      <p>Welcome, {userAttr?.displayName || 'Guest'}!</p>
      <Link href="/view">View data</Link>
      <Link href="/import">Import data</Link>
      <div className="py-8">
        <QuickSightDash />
      </div>
    </div>
  )

  return (
    <AppLayout>
      {welcome}
    </AppLayout>
  )
}
