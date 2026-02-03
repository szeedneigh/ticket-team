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
      // Verify auth session exists before attempting update
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || !session.user) {
        if (debug) {
          logger.debug('No active session, skipping status update')
        }
        return
      }

      // Ensure userId matches the session user
      if (session.user.id !== userId) {
        logger.warn('UserId mismatch in status update', {
          sessionUserId: session.user.id,
          providedUserId: userId
        })
        return
      }

      const { error } = await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        // Only log as warning if it's not an auth issue
        const errorMessage = error.message || 'Unknown error'
        const errorCode = error.code || 'UNKNOWN'
        
        if (error.code === 'PGRST301' || errorMessage.includes('JWT')) {
          if (debug) {
            logger.debug('Auth session not ready yet, will retry on next heartbeat')
          }
        } else {
          // Only log if we have meaningful error information
          const hasErrorInfo = errorMessage !== 'Unknown error' || errorCode !== 'UNKNOWN' || error.details || error.hint
          
          if (hasErrorInfo) {
            logger.error('Failed to update online status', {
              error: errorMessage,
              code: errorCode,
              userId,
              isOnline,
              ...(error.details && { details: error.details }),
              ...(error.hint && { hint: error.hint })
            })
          } else if (debug) {
            // In debug mode, log even empty errors for troubleshooting
            logger.debug('Status update failed with empty error object', { userId, isOnline })
          }
        }
      } else if (debug) {
        logger.debug(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`)
      }
    } catch (error) {
      logger.error('Error updating presence', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name || typeof error,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  /**
   * Send heartbeat to maintain online status
   */
  const sendHeartbeat = async () => {
    if (!isActiveRef.current) return

    try {
      // Verify auth session exists before attempting update
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || !session.user) {
        if (debug) {
          logger.debug('No active session, skipping heartbeat')
        }
        return
      }

      // Ensure userId matches the session user
      if (session.user.id !== userId) {
        logger.warn('UserId mismatch in heartbeat', {
          sessionUserId: session.user.id,
          providedUserId: userId
        })
        return
      }

      const { error } = await supabase
        .from('users')
        .update({
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        // Only log as warning if it's not an auth issue
        const errorMessage = error.message || 'Unknown error'
        const errorCode = error.code || 'UNKNOWN'
        
        if (error.code === 'PGRST301' || errorMessage.includes('JWT')) {
          if (debug) {
            logger.debug('Auth session not ready for heartbeat, will retry')
          }
        } else {
          // Only log if we have meaningful error information
          const hasErrorInfo = errorMessage !== 'Unknown error' || errorCode !== 'UNKNOWN' || error.details || error.hint
          
          if (hasErrorInfo) {
            logger.error('Heartbeat failed', {
              error: errorMessage,
              code: errorCode,
              userId,
              ...(error.details && { details: error.details }),
              ...(error.hint && { hint: error.hint })
            })
          } else if (debug) {
            // In debug mode, log even empty errors for troubleshooting
            logger.debug('Heartbeat failed with empty error object', { userId })
          }
        }
      } else if (debug) {
        logger.debug(`Heartbeat sent for user ${userId}`)
      }
    } catch (error) {
      logger.error('Heartbeat error', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name || typeof error,
        userId,
        stack: error instanceof Error ? error.stack : undefined
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
      logger.debug(`Heartbeat started (interval: ${heartbeatInterval}ms)`)
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
        logger.debug('Heartbeat stopped')
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
        logger.debug('Tab hidden - heartbeat paused')
      }
    } else {
      isActiveRef.current = true
      updateOnlineStatus(true)
      startHeartbeat()
      if (debug) {
        logger.debug('Tab visible - heartbeat resumed')
      }
    }
  }

  /**
   * Handle page unload (set offline before leaving)
   */
  const handleBeforeUnload = () => {
    // sendBeacon could be used for reliable status update
    // Note: This would require an API endpoint to handle the beacon
    // For now, we'll rely on the cleanup in useEffect
    if (debug) {
      logger.debug('Page unloading - setting offline')
    }

    // Synchronous update
    updateOnlineStatus(false)
  }

  useEffect(() => {
    // Validate userId before starting presence tracking
    if (!userId || typeof userId !== 'string') {
      logger.error('Invalid userId provided to usePresence', {
        userId,
        userIdType: typeof userId
      })
      return
    }

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
        logger.debug('Cleanup complete - user set offline')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // Only re-run if userId changes

  return null
}
