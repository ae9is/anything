// prettier-ignore
'use client'

import React, { useState } from 'react'
import logger from 'logger'
import { altTheme, defaultTheme } from '../../lib/theme'
import { IconToggle } from '../IconToggle'
import { DarkModeIcon } from '../icons/DarkModeIcon'
import { LightModeIcon } from '../icons/LightModeIcon'

// Two state theme changer, for example to swap between light and dark modes
export function ThemeChanger() {
  const initialTheme = (typeof window !== 'undefined') ? window?.localStorage?.getItem('theme') ?? defaultTheme : defaultTheme
  const [theme, setTheme] = useState(initialTheme)
  const checked = theme === defaultTheme

  function handleChange() {
    let newTheme
    if (document.documentElement.getAttribute('data-theme') === defaultTheme) {
      newTheme = altTheme
      logger.debug('Set alt theme')
    } else {
      newTheme = defaultTheme
      logger.debug('Set default theme')
    }
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  return (
    <IconToggle
      id="theme-change-toggle"
      data-toggle-theme={`${theme},${altTheme}`}
      readOnly
      checked={checked}
      onChange={handleChange}
      icon={<DarkModeIcon fill="white" />}
      uncheckedIcon={<LightModeIcon />}
    />
  )
}
