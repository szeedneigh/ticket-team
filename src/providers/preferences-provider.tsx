'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useTheme } from 'next-themes'
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
  const { setTheme } = useTheme()
  const [themeInitialized, setThemeInitialized] = useState(false)

  const loadPreferences = useCallback(async () => {
    setIsLoading(true)
    const result = await getUserPreferences()
    if (result.success && result.data) {
      setPreferences(result.data)
      // Only set theme if no localStorage theme exists (first login scenario)
      // This respects user changes that haven't been saved to DB yet
      const storedTheme = typeof window !== 'undefined' 
        ? localStorage.getItem('ticket-team-theme') 
        : null
      if (!storedTheme && !themeInitialized && result.data.theme) {
        setTheme(result.data.theme)
        setThemeInitialized(true)
      }
      // Apply other preferences (font, contrast, etc.) but NOT theme
      applyNonThemePreferences(result.data)
    }
    setIsLoading(false)
  }, [setTheme, themeInitialized])

  const refreshPreferences = async () => {
    await loadPreferences()
  }

  // Initial load - only set theme if next-themes hasn't stored one yet
  useEffect(() => {
    // Check if next-themes already has a stored theme in localStorage
    const storedTheme = typeof window !== 'undefined' 
      ? localStorage.getItem('ticket-team-theme') 
      : null

    if (initialPreferences) {
      // Only apply database theme if no locally stored theme exists
      // This respects user changes that haven't been saved to DB yet
      if (!storedTheme && initialPreferences.theme && !themeInitialized) {
        setTheme(initialPreferences.theme)
        setThemeInitialized(true)
      }
      applyNonThemePreferences(initialPreferences)
    } else {
      loadPreferences()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally run only on mount

  // Apply non-theme preferences when they change
  useEffect(() => {
    if (preferences && themeInitialized) {
      applyNonThemePreferences(preferences)
    }
  }, [preferences, themeInitialized])

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
 * Apply non-theme preferences to the DOM
 * (Theme is handled separately by next-themes to avoid conflicts)
 */
function applyNonThemePreferences(preferences: UserPreferences) {
  if (typeof window === 'undefined') return

  const html = document.documentElement

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
}
