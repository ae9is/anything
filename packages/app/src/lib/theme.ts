// prettier-ignore
'use client'

import { createTheme } from "@mui/material"

// These themes should be in tailwind.config.js under daisyui themes
export const defaultTheme = 'dark'
export const altTheme = 'light'
export const initialTheme =
  typeof window !== 'undefined' ? window?.localStorage?.getItem('theme') || defaultTheme : defaultTheme

export function isDefaultThemeActive() {
  return document.documentElement.getAttribute('data-theme') === defaultTheme
}

// Passes some daisyUI theme colours into MUI's theme.
// MUI palette has { main, light, dark, contrastText }, 
// daisyUI palette has { colour, colour-focus [dark], colour-content [contrastText] }.
// Omit light shades to let MUI calculate them.
// 
// ref: https://mui.com/material-ui/customization/palette/
// ref: https://daisyui.com/docs/colors/
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: 'hsl(var(--p))',
      dark: 'hsl(var(--pf))',
      contrastText: 'hsl(var(--pc))',
    },
    secondary: {
      main: 'hsl(var(--s))',
      dark: 'hsl(var(--sf))',
      contrastText: 'hsl(var(--sc))',
    },
    error: {
      main: 'hsl(var(--er))',
      contrastText: 'hsl(var(--erc))',
    },
    warning: {
      main: 'hsl(var(--wa))',
      contrastText: 'hsl(var(--wac))',
    },
    info: {
      main: 'hsl(var(--in))',
      contrastText: 'hsl(var(--inc))',
    },
    success: {
      main: 'hsl(var(--su))',
      contrastText: 'hsl(var(--suc))',
    }
  }
})