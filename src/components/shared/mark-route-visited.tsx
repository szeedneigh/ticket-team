'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { SKELETON_VISITED_PREFIX } from './skeleton-only-on-first-visit'

/**
 * Marks the current route (and relevant segment keys for dynamic routes) as visited
 * so that loading skeletons are hidden on subsequent navigations in the same session.
 * Place once in the dashboard layout.
 */
export function MarkRouteVisited() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    try {
      const key = `${SKELETON_VISITED_PREFIX}${pathname}`
      sessionStorage.setItem(key, '1')

      // Mark segment keys for dynamic routes so their loading.tsx (which uses a fixed key) is suppressed
      if (/^\/tickets\/[^/]+$/.test(pathname)) {
        sessionStorage.setItem(`${SKELETON_VISITED_PREFIX}/tickets/detail`, '1')
      }
      if (/^\/kb\/[^/]+$/.test(pathname) && !pathname.includes('/edit')) {
        sessionStorage.setItem(`${SKELETON_VISITED_PREFIX}/kb/article`, '1')
      }
      if (/^\/kb\/[^/]+\/edit$/.test(pathname)) {
        sessionStorage.setItem(`${SKELETON_VISITED_PREFIX}/kb/edit`, '1')
      }
    } catch {
      // Ignore if sessionStorage is unavailable
    }
  }, [pathname])

  return null
}
