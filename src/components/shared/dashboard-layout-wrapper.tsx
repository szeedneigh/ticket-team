"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Navbar } from './navbar'
import { BackToTop } from './back-to-top'
import { MarkRouteVisited } from './mark-route-visited'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/lib/types/users'
import { usePreferences } from '@/providers/preferences-provider'

// Dynamically import Sidebar with framer-motion to reduce initial bundle size
// Dynamically import Sidebar with framer-motion to reduce initial bundle size
const Sidebar = dynamic(() => import('./sidebar').then(mod => ({ default: mod.Sidebar })), {
  loading: () => (
    <aside className="hidden lg:flex flex-col flex-shrink-0 w-[280px] h-screen bg-[linear-gradient(180deg,#002C64_48.56%,#0693D2_100%)] border-r border-white/10">
      {/* Logo Skeleton - matches Sidebar p-4 pb-2, w-10 h-10 */}
      <div className="p-4 pb-2 flex items-center gap-2.5">
        <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
        <Skeleton className="h-6 w-32 bg-white/20" />
      </div>

      {/* Nav Skeleton - matches Sidebar px-3 py-4, h-10 nav items */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center w-full h-10 px-3 gap-2.5">
            <Skeleton className="w-5 h-5 rounded bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        ))}
      </div>

      {/* Profile Skeleton - matches Sidebar p-3 mt-auto, p-2.5 profile box */}
      <div className="p-3 mt-auto">
        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
          <Skeleton className="w-9 h-9 rounded-full bg-white/20" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-24 bg-white/20" />
            <Skeleton className="h-3 w-16 bg-white/10" />
          </div>
        </div>
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
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [scrollState, setScrollState] = useState({ atTop: true, atBottom: false })
  const [isHydrated, setIsHydrated] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  const isChatPage = pathname?.startsWith('/chat')

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

  // Track scroll position for shadow indicators (disabled on chat page)
  useEffect(() => {
    // For the AI chat page, we intentionally disable outer scrolling.
    if (isChatPage) {
      setScrollState({ atTop: true, atBottom: true })
      return
    }

    const handleScroll = () => {
      if (mainRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainRef.current
        setScrollState({
          atTop: scrollTop === 0,
          atBottom: scrollTop + clientHeight >= scrollHeight - 1,
        })
      }
    }

    const main = mainRef.current
    if (!main) return

    main.addEventListener('scroll', handleScroll)

    // Initial check
    handleScroll()

    return () => {
      main.removeEventListener('scroll', handleScroll)
    }
  }, [isChatPage])

  return (
    <div className="flex h-full min-h-0 overflow-hidden" suppressHydrationWarning>
      <Suspense
        fallback={
          <aside className="hidden lg:flex flex-col flex-shrink-0 w-[280px] h-screen bg-[linear-gradient(180deg,#002C64_48.56%,#0693D2_100%)] border-r border-white/10">
            <div className="p-4 pb-2 flex items-center gap-2.5">
              <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
              <Skeleton className="h-6 w-32 bg-white/20" />
            </div>
            <div className="flex-1 px-3 py-4 space-y-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-full h-10 px-3">
                  <Skeleton className="w-full h-full rounded-xl bg-white/10" />
                </div>
              ))}
            </div>
          </aside>
        }
      >
        <Sidebar
          user={user}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </Suspense>
      <div className="flex flex-col flex-1 min-w-0 min-h-0" suppressHydrationWarning>
        <Navbar
          user={user}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden" suppressHydrationWarning>
          {/* Top scroll shadow (disabled on chat page where shell doesn't scroll) */}
          {!isChatPage && (
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-8 pointer-events-none z-10 transition-opacity duration-300",
                "bg-gradient-to-b from-background to-transparent",
                scrollState.atTop ? "opacity-0" : "opacity-100"
              )}
            />
          )}

          <main
            ref={mainRef}
            className={cn(
              "flex-1 min-h-0",
              // Chat page: disable outer scrolling so only chat internals (history drawer, messages) scroll
              isChatPage ? "overflow-hidden" : "overflow-y-auto",
              isChatPage ||
                pathname?.startsWith('/kb') ||
                pathname?.startsWith('/tickets') ||
                pathname?.startsWith('/admin') ||
                pathname?.startsWith('/performance')
                ? "p-0"
                : "p-6 lg:p-8"
            )}
          >
            {children}
            <MarkRouteVisited />
          </main>

          {/* Bottom scroll shadow (disabled on chat page where shell doesn't scroll) */}
          {!isChatPage && (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10 transition-opacity duration-300",
                "bg-gradient-to-t from-background to-transparent",
                scrollState.atBottom ? "opacity-0" : "opacity-100"
              )}
            />
          )}
        </div>
        {!isChatPage && <BackToTop target={mainRef} />}
      </div>
    </div>
  )
}
