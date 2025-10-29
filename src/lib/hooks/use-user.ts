/**
 * Client-Side User Hook
 * 
 * React hook for accessing current user state with real-time updates.
 * Automatically subscribes to auth state changes and handles session refresh.
 * 
 * @module lib/hooks/use-user
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'
import { hasPermission } from '@/lib/types/database'

interface UseUserReturn {
  user: User | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

/**
 * Hook to access the current authenticated user
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, hasRole } = useUser()
 *   
 *   if (loading) return <Spinner />
 *   if (!user) return <SignIn />
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.full_name}</p>
 *       {hasRole('admin') && <AdminPanel />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setUser(null)
        return
      }
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (fetchError) throw fetchError
      
      // Check deactivation
      if (data?.deactivated_at) {
        await supabase.auth.signOut()
        setUser(null)
        return
      }
      
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'))
      setUser(null)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    const supabase = createClient()
    
    // Initial fetch
    fetchUser()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, []) // fetchUser is intentionally not in deps as subscription handles refetch
  
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false
    return hasPermission(user.role, role)
  }
  
  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    hasRole,
  }
}

