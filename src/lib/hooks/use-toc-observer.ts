/**
 * Table of Contents Intersection Observer Hook
 *
 * Tracks which heading is currently visible in the viewport and
 * returns the active heading ID for highlighting in the TOC.
 *
 * Features:
 * - Uses Intersection Observer API for performance
 * - Tracks h2 and h3 headings
 * - Returns the currently active heading ID
 * - Cleanup on unmount
 */

'use client'

import { useEffect, useState, useRef } from 'react'

interface UseTocObserverOptions {
  /**
   * Root margin for the intersection observer
   * Negative top margin ensures heading is considered active before it reaches the top
   */
  rootMargin?: string
  /**
   * Intersection threshold (0 to 1)
   */
  threshold?: number
}

export function useTocObserver(options: UseTocObserverOptions = {}) {
  const {
    rootMargin = '-80px 0px -80% 0px',
    threshold = 1
  } = options

  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Get all h2 and h3 headings with IDs
    const headings = document.querySelectorAll(
      'article h2[id], article h3[id]'
    )

    if (headings.length === 0) return

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When a heading enters the viewport, mark it as active
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    // Observe all headings
    headings.forEach((heading) => {
      observerRef.current?.observe(heading)
    })

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [rootMargin, threshold])

  return activeId
}
