import Head from 'next/head'
import { AuthProvider } from '../auth/AuthProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <div>
        <Head>
          <title>anything: A flexible document storage / item management system</title>
        </Head>
        <AuthProvider>
          <div className="bg-base-200 min-h-screen">{children}</div>
        </AuthProvider>
      </div>
  )
}
