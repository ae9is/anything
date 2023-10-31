import { Html, Head, Main, NextScript } from 'next/document'
import { initialTheme } from '../lib/theme'

export default function Document() {
  return (
    <Html lang="en" data-theme={initialTheme}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
