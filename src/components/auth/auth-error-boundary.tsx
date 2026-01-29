/**
 * Authentication Session Monitor
 * 
 * Monitors Supabase auth state and automatically handles invalid sessions.
 * Clears stale tokens and prompts re-authentication when needed.
 * 
 * @module components/auth/auth-error-boundary
 */

'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function AuthSessionMonitor({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hasShownErrorRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes and errors
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip processing on auth pages to avoid redirect loops
      if (pathname?.startsWith('/auth')) {
        return
      }

      // Handle successful sign out
      if (event === 'SIGNED_OUT') {
        hasShownErrorRef.current = false
        router.push('/auth/sign-in')
        return
      }

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED') {
        hasShownErrorRef.current = false
        return
      }

      // Detect stale/invalid session: no session but we're on a protected route
      const protectedRoutes = ['/dashboard', '/tickets', '/admin', '/kb', '/chat', '/analytics', '/profile', '/notifications']
      const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route))

      if (isProtectedRoute && !session && event !== 'INITIAL_SESSION') {
        // Only show error once to avoid spam
        if (!hasShownErrorRef.current) {
          console.warn('[Auth] Session expired or invalid, clearing and redirecting')
          hasShownErrorRef.current = true
          
          // Show user-friendly message
          toast.error('Session expired', {
            description: 'Please sign in again to continue',
          })
        }

        // Clear any stale session data
        try {
          await supabase.auth.signOut()
        } catch (error) {
          // Ignore signOut errors - we're already in a bad state
          console.error('[Auth] Error during signOut:', error)
        }

        // Redirect to sign-in
        router.push(`/auth/sign-in?redirectedFrom=${pathname}`)
      }
    })

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  return <>{children}</>
}
