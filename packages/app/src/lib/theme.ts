// prettier-ignore
'use client'

// These themes should be in tailwind.config.js under daisyui themes
export const defaultTheme = 'dark'
export const altTheme = 'light'
export const initialTheme =
  typeof window !== 'undefined' ? window?.localStorage?.getItem('theme') || defaultTheme : defaultTheme

export function isDefaultThemeActive() {
  return document.documentElement.getAttribute('data-theme') === defaultTheme
}
