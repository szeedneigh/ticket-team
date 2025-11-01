/**
 * Presence Tracker Component
 *
 * Client component wrapper for the usePresence hook.
 * Should be included in the dashboard layout to track user presence.
 *
 * @module components/shared/presence-tracker
 */

'use client'

import { usePresence } from '@/lib/hooks/use-presence'
import type { User } from '@/lib/types/users'

interface PresenceTrackerProps {
  user: User
}

/**
 * Tracks user presence in real-time
 * This component doesn't render anything visible
 */
export function PresenceTracker({ user }: PresenceTrackerProps) {
  usePresence({ userId: user.id })

  return null
}
