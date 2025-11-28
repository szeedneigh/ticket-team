"use client"

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { Navbar } from './navbar'
import { BackToTop } from './back-to-top'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/lib/types/users'
import { usePreferences } from '@/providers/preferences-provider'

// Dynamically import Sidebar with framer-motion to reduce initial bundle size
const Sidebar = dynamic(() => import('./sidebar').then(mod => ({ default: mod.Sidebar })), {
  loading: () => (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </aside>
  ),
  ssr: false
})

interface DashboardLayoutWrapperProps {
  user: User
  children: React.ReactNode
}

export function DashboardLayoutWrapper({ user, children }: DashboardLayoutWrapperProps) {
  const { preferences } = usePreferences()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [scrollState, setScrollState] = useState({ atTop: true, atBottom: false })
  const [isHydrated, setIsHydrated] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  // Load collapsed state from preferences or localStorage on mount (after hydration)
  useEffect(() => {
    setIsHydrated(true)
    
    // Priority: user preferences > localStorage
    if (preferences && preferences.sidebar_collapsed !== undefined) {
      setIsCollapsed(preferences.sidebar_collapsed)
    } else {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }
  }, [preferences])

  // Save collapsed state to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed, isHydrated])

  // Track scroll position for shadow indicators
  useEffect(() => {
    const handleScroll = () => {
      if (mainRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainRef.current
        setScrollState({
          atTop: scrollTop === 0,
          atBottom: scrollTop + clientHeight >= scrollHeight - 1
        })
      }
    }

    const main = mainRef.current
    main?.addEventListener('scroll', handleScroll)

    // Initial check
    handleScroll()

    return () => main?.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex h-full overflow-hidden" suppressHydrationWarning>
      <Sidebar
        user={user}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex flex-col flex-1 min-w-0" suppressHydrationWarning>
        <Navbar
          user={user}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className="relative flex-1 overflow-hidden" suppressHydrationWarning>
          {/* Top scroll shadow */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-8 pointer-events-none z-10 transition-opacity duration-300",
              "bg-gradient-to-b from-background to-transparent",
              scrollState.atTop ? "opacity-0" : "opacity-100"
            )}
          />

          <main ref={mainRef} className="flex-1 overflow-y-auto p-6 lg:p-8 h-full">
            {children}
          </main>

          {/* Bottom scroll shadow */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10 transition-opacity duration-300",
              "bg-gradient-to-t from-background to-transparent",
              scrollState.atBottom ? "opacity-0" : "opacity-100"
            )}
          />
        </div>
        <BackToTop target={mainRef} />
      </div>
    </div>
  )
}
