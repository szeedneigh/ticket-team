'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { ChatWidgetInitializer } from '@/components/chat/chat-widget-initializer'
import { PreferencesProvider } from '@/providers/preferences-provider'
import type { UserPreferences } from '@/lib/types/users'

interface ProvidersProps {
  children: React.ReactNode
  initialPreferences?: UserPreferences | null
}

export function Providers({ children, initialPreferences }: ProvidersProps) {
  // Suppress hydration warnings from browser extensions
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      // Filter out hydration warnings related to browser extensions
      const message = args[0]?.toString() || ''

      // Suppress known browser extension-related hydration errors
      if (
        message.includes('Hydration') &&
        (message.includes('fdprocessedid') ||
         message.includes('browser extension') ||
         message.includes('attribute'))
      ) {
        // Silently ignore these warnings
        return
      }

      // Allow all other console errors through
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="ticket-team-theme"
    >
      <PreferencesProvider initialPreferences={initialPreferences}>
        {/* Top Progress Bar for Navigation */}
        <ProgressBar
          height="3px"
          color="#0693D2"
          options={{ showSpinner: false }}
          shallowRouting
        />

        {children}
        <Toaster richColors position="top-right" />

        {/* Floating Chat Widget */}
        <ChatWidgetInitializer />
      </PreferencesProvider>
    </ThemeProvider>
  )
}
