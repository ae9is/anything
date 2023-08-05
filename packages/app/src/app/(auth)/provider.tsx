// prettier-ignore
'use client'

import { useEffect, useState } from 'react'
import { Amplify, Hub } from 'aws-amplify'
import awsExports from '../../config/amplify'
Amplify.configure(awsExports)

import { getUser, getUserAttr } from '../../lib/auth'
import { createContext } from 'react'

export const UserContext = createContext<any>(null)
export const UserAttrContext = createContext<any>(null)

export interface ProviderProps {
  children: React.ReactNode
}

// ref: https://docs.amplify.aws/lib/auth/social/q/platform/js/#redirect-urls
export function AuthProvider(props: ProviderProps) {
  const [user, setUser] = useState<any>(null)
  const [userAttr, setUserAttr] = useState<any>(null)

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          getUser().then((userData) => setUser(userData))
          getUserAttr().then((attr) => setUserAttr(attr))
          break
        case 'signOut':
          setUser(null)
          setUserAttr(null)
          break
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          console.log('Sign in failure', data)
          break
      }
    })
    getUser().then((userData) => setUser(userData))
    getUserAttr().then((attr) => setUserAttr(attr))
  }, [])

  return (
    <UserContext.Provider value={user}>
      <UserAttrContext.Provider value={userAttr}>{props?.children}</UserAttrContext.Provider>
    </UserContext.Provider>
  )
}
