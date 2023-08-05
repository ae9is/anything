// prettier-ignore
'use client'

export const isLocalhost =
  typeof window !== 'undefined'
    ? Boolean(
        window.location.hostname === 'localhost' ||
          // [::1] is the IPv6 localhost address.
          window.location.hostname === '[::1]' ||
          // 127.0.0.1/8 is considered localhost for IPv4.
          window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
          ) ||
          false
      )
    : undefined

// Next.js sets process.env.NODE_ENV on both server and browser, it's a special case
// eslint-disable-next-line turbo/no-undeclared-env-vars
export const isDev = process.env.NODE_ENV === 'development'
