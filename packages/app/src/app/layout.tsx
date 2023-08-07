// prettier-ignore
'use client'

// Disallow server only features, this app will be served as a static bundle
// ref: https://nextjs.org/docs/app/building-your-application/deploying/static-exports#unsupported-features
export const dynamic = 'error'

import { initialTheme } from '../lib/theme'
import { AuthProvider } from './(auth)/provider'
import './styles.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={initialTheme}>
      <head>
        <title>anything: A flexible document storage / item management system</title>
      </head>
      <body>
        <AuthProvider>
          <div className="bg-base-200 min-h-screen">{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}
