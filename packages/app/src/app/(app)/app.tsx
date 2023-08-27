// prettier-ignore
'use client'

import { Link } from '../../components'
import { useContext } from 'react'
import { UserAttrContext } from '../(auth)/provider'
import AppLayout from './layout'

export default function App() {
  const userAttr = useContext<any>(UserAttrContext)

  const welcome = (
    <div className="flex flex-col prose container mx-auto text-center justify-center items-center p-24 gap-10">
      <p>Welcome, {userAttr?.displayName || 'Guest'}!</p>
      <Link href="/view">View data</Link>
      <Link href="/import">Import data</Link>
    </div>
  )

  // TODO dashboard (summary stats & graphics on items, collections, types in database)

  return (
    <AppLayout>
      {welcome}
    </AppLayout>
  )
}
