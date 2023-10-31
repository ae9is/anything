import { useContext } from 'react'
import { UserAttrContext } from './auth/AuthProvider'

export function Avatar() {
  const userAttr = useContext(UserAttrContext)
  const initial = userAttr?.displayName?.[0] ?? '?'

  return (
    <div className="avatar placeholder cursor-pointer">
      <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
        <span className="text-xs">{initial}</span>
      </div>
    </div>
  )
}
