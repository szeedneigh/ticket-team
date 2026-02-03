'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { ChatWidgetInitializer } from '@/components/chat/chat-widget-initializer'
import { PreferencesProvider } from '@/providers/preferences-provider'
import { AuthSessionMonitor } from '@/components/auth/auth-error-boundary'
import type { UserPreferences } from '@/lib/types/users'

interface ProvidersProps {
  children: React.ReactNode
  initialPreferences?: UserPreferences | null
}

export function Providers({ children, initialPreferences }: ProvidersProps) {
  // Suppress hydration warnings from browser extensions
  useEffect(() => {
    // In some environments (and with certain tooling), console methods may not be real
    // Functions (no .apply). Capture safe, bound callables so our wrapper never throws.
    const originalError =
      typeof console.error === 'function' ? console.error.bind(console) : null
    const originalLog = typeof console.log === 'function' ? console.log.bind(console) : null

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
      try {
        if (originalError) {
          // Filter out empty objects from args to prevent logging issues
          const filteredArgs = args.filter(arg => {
            if (typeof arg === 'object' && arg !== null) {
              // Only include objects that have at least one property
              return Object.keys(arg).length > 0
            }
            return true
          })
          
          // If we have at least one meaningful arg, log it
          if (filteredArgs.length > 0) {
            originalError(...filteredArgs)
          } else if (args.length > 0) {
            // If all args were filtered but we had args, log just the message
            originalError(args[0])
          }
        } else if (originalLog) {
          originalLog(...args)
        }
      } catch (err) {
        // Never let logging crash the app
        // Silently fail - logging errors shouldn't break the application
      }
    }

    return () => {
      if (originalError) {
        console.error = originalError
      }
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
        <AuthSessionMonitor>
          {/* Top Progress Bar for Navigation */}
          <ProgressBar
            height="3px"
            color="#0693D2"
            options={{ showSpinner: false }}
            shallowRouting
          />

          {children}
          <Toaster richColors position="top-right" />

          {/* Floating Chat Widget - Visible on all pages except /chat */}
          <ChatWidgetInitializer />
        </AuthSessionMonitor>
      </PreferencesProvider>
    </ThemeProvider>
  )
}
