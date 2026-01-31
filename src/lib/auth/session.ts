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
import { headers } from 'next/headers'
import { logger } from '@/lib/logger'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'
import { hasPermission } from '@/lib/types/database'

/** E2E test bypass: mock user returned when x-e2e-test-auth header matches E2E_BYPASS_SECRET. Configurable via env. */
const E2E_MOCK_USER: User = {
  id: process.env.E2E_TEST_USER_ID ?? '49a84551-f65c-420a-b5f1-97e1b814e41b',
  email: process.env.E2E_TEST_USER_EMAIL ?? 'test@laverdad.edu.ph',
  full_name: process.env.E2E_TEST_USER_NAME ?? 'Test User',
  role: (process.env.E2E_TEST_USER_ROLE as User['role']) ?? 'admin',
  department: null,
  position: null,
  phone: null,
  avatar_url: null,
  is_online: false,
  last_seen: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: null,
  deactivated_at: null,
  deactivated_by: null,
}

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
    logger.error('User fetch error', { error: error?.message })
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
 *
 * E2E Test Bypass: Only works in development/test with secret token
 *
 * @returns The authenticated user
 */
export async function requireAuth(): Promise<User> {
  // E2E Test Bypass Mode - ONLY FOR DEVELOPMENT/TEST
  // SECURITY: Production never allows bypass
  if (process.env.NODE_ENV !== 'production') {
    const headersList = await headers()
    const bypassHeader = headersList.get('x-e2e-test-auth')
    const bypassSecret = process.env.E2E_BYPASS_SECRET

    if (bypassHeader && bypassSecret && bypassHeader === bypassSecret) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[E2E Test Mode] Auth bypass enabled in requireAuth()')
      }
      return E2E_MOCK_USER
    }
  }

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

