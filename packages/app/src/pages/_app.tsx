import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

import './styles.css'
import useMounted from '../lib/useMounted'
 
// ref: https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts#with-typescript
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}
 
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}
 
export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page)
  const mounted = useMounted()
  return mounted && getLayout(<Component {...pageProps} />)
}
