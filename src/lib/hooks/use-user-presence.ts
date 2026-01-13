/**
 * User Presence Hook
 *
 * Tracks online users using Supabase Realtime presence feature.
 * Shows all authenticated users who are currently active.
 *
 * @module lib/hooks/use-user-presence
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

export interface OnlineUser {
  userId: string
  fullName: string
  email: string
  avatarUrl?: string
  role: 'employee' | 'staff' | 'admin' | 'super_admin'
  lastSeen: string
}

export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    let presenceChannel: RealtimeChannel | null = null

    async function setupPresence() {
      try {
        const supabase = createClient()
        
        // Get current user info
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email, avatar_url, role')
          .eq('id', user.id)
          .single()

        if (userError || !userData) return

        // Create presence channel
        presenceChannel = supabase.channel('online-users', {
          config: { 
            presence: { 
              key: user.id 
            } 
          }
        })

        // Subscribe to presence changes
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            try {
              const state: RealtimePresenceState<OnlineUser> = presenceChannel?.presenceState() || {}
              const users: OnlineUser[] = []

              Object.keys(state).forEach(presenceKey => {
                const presences = state[presenceKey]
                if (Array.isArray(presences)) {
                  presences.forEach(presence => {
                    // Only include valid user data
                    if (presence && typeof presence === 'object' && 'userId' in presence) {
                      users.push(presence as OnlineUser)
                    }
                  })
                }
              })

              setOnlineUsers(users)
            } catch (error) {
              console.error('Error processing presence state:', error)
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && presenceChannel) {
              try {
                // Track current user as online
                await presenceChannel.track({
                  userId: user.id,
                  fullName: userData.full_name,
                  email: userData.email,
                  avatarUrl: userData.avatar_url || undefined,
                  role: userData.role,
                  lastSeen: (() => {
                    try {
                      return new Date().toISOString()
                    } catch {
                      return new Date(Date.now()).toISOString()
                    }
                  })()
                })
              } catch (error) {
                console.error('Error tracking presence:', error)
              }
            }
          })

        setChannel(presenceChannel)
      } catch (error) {
        console.error('Error setting up presence:', error)
      }
    }

    setupPresence()

    // Cleanup on unmount
    return () => {
      if (presenceChannel) {
        try {
          presenceChannel.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from presence:', error)
        }
      }
    }
  }, [])

  return { onlineUsers, channel }
}
