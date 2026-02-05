'use client'

import { useState } from 'react'

export const SKELETON_VISITED_PREFIX = 'skeleton-visited-'

/**
 * Renders children (skeleton UI) only on the first visit to a route in this session.
 * Use with MarkRouteVisited in the layout so that when the real page mounts, the
 * route is marked visited and future navigations won't show the skeleton.
 *
 * @param storageKey - Full key for sessionStorage (e.g. skeleton-visited-/dashboard)
 * @param children - Skeleton content to show on first visit only
 */
export function SkeletonOnlyOnFirstVisit({
  storageKey,
  children,
}: {
  storageKey: string
  children: React.ReactNode
}) {
  const [showSkeleton] = useState(() => {
    if (typeof window === 'undefined') return true
    return !sessionStorage.getItem(storageKey)
  })

  if (!showSkeleton) return null
  return <>{children}</>
}
