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
 * Get the current authenticated user from Supabase Auth
 * Uses getUser() which authenticates with the Supabase Auth server for security
 * Cached across the request lifecycle to prevent duplicate fetches
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
})

/**
 * Get the current database user record
 * Returns null if not authenticated or user is deactivated
 * Cached across the request lifecycle
 */
export const getUser = cache(async (): Promise<User | null> => {
  const authUser = await getAuthUser()
  if (!authUser) return null
  
  const supabase = await createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
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
  const authUser = await getAuthUser()
  return authUser?.id ?? null
}

/**
 * Check if the current user is authenticated
 * @returns Boolean indicating authentication status
 */
export async function isAuthenticated(): Promise<boolean> {
  const authUser = await getAuthUser()
  return authUser !== null
}

/**
 * Get the user's email from authenticated user
 * @returns The user's email or null if not authenticated
 */
export async function getUserEmail(): Promise<string | null> {
  const authUser = await getAuthUser()
  return authUser?.email ?? null
}

