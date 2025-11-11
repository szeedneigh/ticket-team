'use client'

import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { NavigationLoading } from '@/components/shared/navigation-loading'

export function Providers({ children }: { children: React.ReactNode }) {
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
    >
      {/* Top Progress Bar for Navigation */}
      <ProgressBar
        height="3px"
        color="#0693D2"
        options={{ showSpinner: false }}
        shallowRouting
      />
      
      {/* Loading Overlay for Slow Navigation (>300ms) */}
      <NavigationLoading />
      
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  )
}

