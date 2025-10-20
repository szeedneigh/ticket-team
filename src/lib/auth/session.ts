/**
 * Server-Side Authentication Utilities
 * 
 * Provides server-side helpers for authentication and authorization.
 * These functions are cached across the request lifecycle for optimal performance.
 * 
 * @module lib/auth/session
 */

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'
import { hasPermission } from '@/lib/types/database'

/**
 * Get the current session
 * Cached across the request lifecycle to prevent duplicate fetches
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session error:', error)
    return null
  }
  
  return session
})

/**
 * Get the current authenticated user
 * Returns null if not authenticated or user is deactivated
 * Cached across the request lifecycle
 */
export const getUser = cache(async (): Promise<User | null> => {
  const session = await getSession()
  if (!session?.user) return null
  
  const supabase = await createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  if (error || !user) {
    console.error('User fetch error:', error)
    return null
  }
  
  // Check if user is deactivated
  if (user.deactivated_at) {
    return null
  }
  
  return user
})

/**
 * Require authentication
 * Redirects to sign-in page if not authenticated
 * @returns The authenticated user
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return user
}

/**
 * Require a specific role
 * Redirects to dashboard with error if insufficient permissions
 * @param requiredRole - The minimum role required
 * @returns The authenticated user with sufficient permissions
 */
export async function requireRole(requiredRole: UserRole): Promise<User> {
  const user = await requireAuth()
  
  if (!hasPermission(user.role, requiredRole)) {
    redirect('/dashboard?error=insufficient_permissions')
  }
  
  return user
}

/**
 * Check if the current user has a specific role
 * @param requiredRole - The role to check
 * @returns Boolean indicating if user has the role
 */
export async function checkRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getUser()
  
  if (!user) return false
  
  return hasPermission(user.role, requiredRole)
}

/**
 * Get the authenticated user's ID
 * @returns The user ID or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

/**
 * Check if the current user is authenticated
 * @returns Boolean indicating authentication status
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Get the user's email from session
 * @returns The user's email or null if not authenticated
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.email ?? null
}

