/**
 * Clear Session Utility Page
 * 
 * Manually clears all authentication data and redirects to sign-in.
 * Useful for debugging auth issues or clearing stale sessions.
 * 
 * @module app/auth/clear-session/page
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function ClearSessionPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'clearing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const clearSession = useCallback(async () => {
    setStatus('clearing')
    setMessage('Clearing session...')

    try {
      const supabase = createClient()

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear localStorage
      if (typeof window !== 'undefined') {
        // Clear all Supabase-related items
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      }

      setStatus('success')
      setMessage('Session cleared successfully!')

      // Redirect after 1 second
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 1000)
    } catch (error) {
      console.error('Error clearing session:', error)
      setStatus('error')
      setMessage('Error clearing session. Please clear your browser cookies manually.')
    }
  }, [router])

  useEffect(() => {
    // Auto-clear on mount
    clearSession()
  }, [clearSession])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Clear Session</h1>
          <p className="text-sm text-muted-foreground">
            Clearing authentication data and cookies
          </p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          {status === 'clearing' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {message}
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to sign-in...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-destructive">{message}</p>
              <Button onClick={clearSession} variant="outline" className="mt-4">
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/auth/sign-in')}
                variant="default"
                className="mt-2"
              >
                Go to Sign In
              </Button>
            </>
          )}
        </div>

        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <p className="text-xs font-medium">Manual Cleanup Instructions:</p>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Application/Storage tab</li>
            <li>Clear all cookies for this domain</li>
            <li>Clear localStorage</li>
            <li>Refresh the page</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
