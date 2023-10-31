import { ReactElement } from 'react'
import { NextPageWithLayout } from '../../pages/_app'
import RootLayout from './RootLayout'
import AppLayout from './AppLayout'

export function withRootLayout(Page: NextPageWithLayout) {
  Page.getLayout = function getLayout(page: ReactElement) {
    return <RootLayout>{page}</RootLayout>
  }
  return Page
}

// withAppLayout
export function withLayout(Page: NextPageWithLayout) {
  Page.getLayout = function getLayout(page: ReactElement) {
    return (
      <RootLayout>
        <AppLayout>{page}</AppLayout>
      </RootLayout>
    )
  }
  return Page
}
