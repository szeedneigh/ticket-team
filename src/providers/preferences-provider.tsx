'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getUserPreferences } from '@/app/actions/preferences'
import type { UserPreferences } from '@/lib/types/users'

interface PreferencesContextType {
  preferences: UserPreferences | null
  isLoading: boolean
  refreshPreferences: () => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

interface PreferencesProviderProps {
  children: ReactNode
  initialPreferences?: UserPreferences | null
}

export function PreferencesProvider({ children, initialPreferences }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(initialPreferences || null)
  const [isLoading, setIsLoading] = useState(!initialPreferences)

  const loadPreferences = async () => {
    setIsLoading(true)
    const result = await getUserPreferences()
    if (result.success && result.data) {
      setPreferences(result.data)
      applyPreferencesToDOM(result.data)
    }
    setIsLoading(false)
  }

  const refreshPreferences = async () => {
    await loadPreferences()
  }

  useEffect(() => {
    if (!initialPreferences) {
      loadPreferences()
    } else {
      applyPreferencesToDOM(initialPreferences)
    }
  }, [])

  // Apply preferences whenever they change
  useEffect(() => {
    if (preferences) {
      applyPreferencesToDOM(preferences)
    }
  }, [preferences])

  return (
    <PreferencesContext.Provider value={{ preferences, isLoading, refreshPreferences }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

/**
 * Apply user preferences to the DOM
 */
function applyPreferencesToDOM(preferences: UserPreferences) {
  if (typeof window === 'undefined') return

  const html = document.documentElement

  // Apply theme (light/dark/system)
  if (preferences.theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    html.setAttribute('data-theme', systemTheme)
    html.classList.toggle('dark', systemTheme === 'dark')
  } else {
    html.setAttribute('data-theme', preferences.theme)
    html.classList.toggle('dark', preferences.theme === 'dark')
  }

  // Apply font size
  html.setAttribute('data-font-size', preferences.font_size || 'normal')

  // Apply accessibility preferences
  html.setAttribute('data-high-contrast', preferences.high_contrast ? 'true' : 'false')
  html.setAttribute('data-reduced-motion', preferences.reduced_motion ? 'true' : 'false')

  // Apply reduced motion via CSS
  if (preferences.reduced_motion) {
    html.style.setProperty('--duration-base', '0ms')
    html.style.setProperty('--duration-fast', '0ms')
    html.style.setProperty('--duration-slow', '0ms')
  } else {
    html.style.removeProperty('--duration-base')
    html.style.removeProperty('--duration-fast')
    html.style.removeProperty('--duration-slow')
  }

  // Listen for system theme changes if using system preference
  if (preferences.theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light'
      html.setAttribute('data-theme', systemTheme)
      html.classList.toggle('dark', systemTheme === 'dark')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }
}
