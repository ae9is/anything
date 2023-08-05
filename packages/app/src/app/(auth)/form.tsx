// prettier-ignore
'use client'

import { useContext } from 'react'

import { App } from '../(app)/app'
import { signIn } from '../../lib/auth'
import { Footer } from '../../components'
import { UserContext } from './provider'

// ref: https://docs.amplify.aws/lib/auth/social/q/platform/js/#redirect-urls
export function AuthForm() {
  const user = useContext(UserContext)

  async function handleSignIn() {
    signIn()
  }

  const loginForm = (
    <div className="h-screen">
      <div className="h-2/3 flex items-center justify-center bg-base-200">
        <div className="max-w-md text-center justify-center items-center p-4">
          <h1 className="text-5xl font-bold underline">anything</h1>
          <h3 className="py-6">Item management system</h3>
          <button className="my-6 btn btn-primary" onClick={handleSignIn}>
            Sign in
          </button>
        </div>
      </div>
      <div className="h-1/3 bg-base-300">
        <Footer />
      </div>
    </div>
  )

  return (
    <>
      {!user && loginForm}
      {user && <App />}
    </>
  )
}
