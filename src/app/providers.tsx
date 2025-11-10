'use client'

import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { NavigationLoading } from '@/components/shared/navigation-loading'

export function Providers({ children }: { children: React.ReactNode }) {
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

