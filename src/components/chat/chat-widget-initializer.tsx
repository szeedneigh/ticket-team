/**
 * ChatWidgetInitializer Component
 *
 * Fetches user session and initializes the chat widget.
 * Only renders the widget if user is authenticated AND on dashboard pages.
 *
 * Widget visibility rules:
 * - Only appears on authenticated dashboard routes
 * - Hidden on public landing page and auth pages
 * - Route must start with dashboard path segments
 *
 * @module components/chat/chat-widget-initializer
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChatWidgetWrapper } from './chat-widget-wrapper'
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// Component
// ============================================================================

export function ChatWidgetInitializer() {
  const pathname = usePathname()
  const [userInfo, setUserInfo] = useState<{ id: string; name?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Fetch user profile for full name (maybeSingle avoids 406 for first-time users)
          const { data: profile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle()

          setUserInfo({
            id: user.id,
            name: profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0],
          })
        }
      } catch (error) {
        console.error('Failed to fetch user for chat widget:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Check if we're on a dashboard route
  const isDashboardRoute =
    pathname !== '/' && // Not landing page
    !pathname.startsWith('/auth') && // Not auth pages
    pathname !== '/chat' && // Not chat page (widget should be hidden there)
    !pathname.startsWith('/chat/') // Not chat sub-pages

  // Don't render widget if:
  // 1. Not on dashboard route
  // 2. Still loading user data
  // 3. User not authenticated
  if (!isDashboardRoute || isLoading || !userInfo) {
    return null
  }

  return (
    <ChatWidgetWrapper
      userId={userInfo.id}
      userName={userInfo.name}
    />
  )
}
