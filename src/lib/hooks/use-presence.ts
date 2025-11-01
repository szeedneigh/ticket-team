/**
 * User Presence Tracking Hook
 *
 * Manages real-time user online/offline status using Supabase.
 * - Automatically sets user as online when component mounts
 * - Sends heartbeat every 30 seconds to maintain online status
 * - Sets user as offline when component unmounts or before page unload
 * - Handles visibility changes (tab switching)
 *
 * @module lib/hooks/use-presence
 */

'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface UsePresenceOptions {
  /** User ID to track presence for */
  userId: string
  /** Heartbeat interval in milliseconds (default: 30000 = 30 seconds) */
  heartbeatInterval?: number
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Track user presence and automatically update online/offline status
 *
 * @example
 * ```tsx
 * // In a client component (e.g., dashboard layout)
 * 'use client'
 * function DashboardLayout({ user }) {
 *   usePresence({ userId: user.id })
 *   return <div>...</div>
 * }
 * ```
 */
export function usePresence({
  userId,
  heartbeatInterval = 30000,
  debug = false
}: UsePresenceOptions) {
  const supabase = createClient()
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)

  /**
   * Update user online status in database
   */
  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        logger.error('Failed to update online status', {
          error: error.message,
          userId,
          isOnline
        })
      } else if (debug) {
        console.log(`[Presence] User ${userId} is now ${isOnline ? 'online' : 'offline'}`)
      }
    } catch (error) {
      logger.error('Error updating presence', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      })
    }
  }

  /**
   * Send heartbeat to maintain online status
   */
  const sendHeartbeat = async () => {
    if (!isActiveRef.current) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        logger.error('Heartbeat failed', { error: error.message, userId })
      } else if (debug) {
        console.log(`[Presence] Heartbeat sent for user ${userId}`)
      }
    } catch (error) {
      logger.error('Heartbeat error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      })
    }
  }

  /**
   * Start heartbeat interval
   */
  const startHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(sendHeartbeat, heartbeatInterval)

    if (debug) {
      console.log(`[Presence] Heartbeat started (interval: ${heartbeatInterval}ms)`)
    }
  }

  /**
   * Stop heartbeat interval
   */
  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null

      if (debug) {
        console.log('[Presence] Heartbeat stopped')
      }
    }
  }

  /**
   * Handle visibility change (tab switching)
   */
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isActiveRef.current = false
      stopHeartbeat()
      if (debug) {
        console.log('[Presence] Tab hidden - heartbeat paused')
      }
    } else {
      isActiveRef.current = true
      updateOnlineStatus(true)
      startHeartbeat()
      if (debug) {
        console.log('[Presence] Tab visible - heartbeat resumed')
      }
    }
  }

  /**
   * Handle page unload (set offline before leaving)
   */
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable status update before page closes
    const blob = new Blob(
      [JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })],
      { type: 'application/json' }
    )

    // Fallback to synchronous update if sendBeacon not available
    if (navigator.sendBeacon) {
      // Note: This would require an API endpoint to handle the beacon
      // For now, we'll rely on the cleanup in useEffect
      if (debug) {
        console.log('[Presence] Page unloading - setting offline')
      }
    }

    // Synchronous update as fallback
    updateOnlineStatus(false)
  }

  useEffect(() => {
    // Set user as online when component mounts
    updateOnlineStatus(true)
    startHeartbeat()

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup: Set user as offline when component unmounts
    return () => {
      stopHeartbeat()
      updateOnlineStatus(false)

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (debug) {
        console.log('[Presence] Cleanup complete - user set offline')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // Only re-run if userId changes

  return null
}
