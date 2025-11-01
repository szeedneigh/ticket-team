/**
 * User Query Utilities
 *
 * Type-safe query builders for fetching user data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@/lib/types/users'

// ============================================================================
// User Queries
// ============================================================================

/**
 * Get all staff users (staff, admin, super_admin)
 * Used for ticket assignment dropdowns
 */
export async function getStaffUsers(
  supabase: SupabaseClient
): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url, role, department, position')
    .in('role', ['staff', 'admin', 'super_admin'])
    .is('deactivated_at', null) // Only active users
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch staff users: ${error.message}`)
  }

  return data as User[]
}

/**
 * Get a user by ID
 */
export async function getUserById(
  supabase: SupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return data as User
}

/**
 * Get multiple users by IDs
 */
export async function getUsersByIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<User[]> {
  if (userIds.length === 0) return []

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds)

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return data as User[]
}
