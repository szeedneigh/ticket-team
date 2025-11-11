/**
 * Navigation Loading Indicator
 * 
 * Shows a subtle loading overlay when navigation takes longer than 300ms
 * Provides better UX feedback during slow page transitions
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function NavigationLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true)

    // Small delay to avoid flash for fast navigations
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none transition-opacity duration-200">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  )
}

