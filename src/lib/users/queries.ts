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

// ============================================================================
// User Management Queries
// ============================================================================

/**
 * Get all users with pagination and filters
 * Supports filtering by role, department, active status, and search
 *
 * @param supabase - Supabase client
 * @param filters - Filter options (role, department, is_active, search)
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page (default: 20)
 * @returns Paginated user list with total count
 */
export async function getAllUsers(
  supabase: SupabaseClient,
  filters?: {
    role?: string
    department?: string
    is_active?: boolean
    search?: string
  },
  page: number = 1,
  perPage: number = 20
): Promise<{ users: User[]; total: number; page: number; per_page: number }> {
  // Build query
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })

  // Apply filters
  if (filters?.role) {
    query = query.eq('role', filters.role)
  }

  if (filters?.department) {
    query = query.eq('department', filters.department)
  }

  if (filters?.is_active !== undefined) {
    if (filters.is_active) {
      query = query.is('deactivated_at', null)
    } else {
      query = query.not('deactivated_at', 'is', null)
    }
  }

  // Search across multiple fields
  if (filters?.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`
    query = query.or(
      `full_name.ilike.${searchTerm},email.ilike.${searchTerm},department.ilike.${searchTerm},position.ilike.${searchTerm}`
    )
  }

  // Apply pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  query = query.range(from, to).order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return {
    users: (data as User[]) || [],
    total: count || 0,
    page,
    per_page: perPage,
  }
}

/**
 * Get deactivated users
 * Returns all users who have been deactivated
 *
 * @param supabase - Supabase client
 * @returns List of deactivated users
 */
export async function getDeactivatedUsers(
  supabase: SupabaseClient
): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .not('deactivated_at', 'is', null)
    .order('deactivated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch deactivated users: ${error.message}`)
  }

  return data as User[]
}

/**
 * Search users by query string
 * Performs full-text search across name, email, department, and position
 *
 * @param supabase - Supabase client
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 * @param includeDeactivated - Include deactivated users in results (default: false)
 * @returns List of matching users
 */
export async function searchUsers(
  supabase: SupabaseClient,
  query: string,
  limit: number = 10,
  includeDeactivated: boolean = false
): Promise<User[]> {
  if (!query.trim()) return []

  const searchTerm = `%${query.trim()}%`

  let dbQuery = supabase
    .from('users')
    .select('id, full_name, email, avatar_url, role, department, position, deactivated_at')
    .or(
      `full_name.ilike.${searchTerm},email.ilike.${searchTerm},department.ilike.${searchTerm},position.ilike.${searchTerm}`
    )
    .limit(limit)
    .order('full_name', { ascending: true })

  if (!includeDeactivated) {
    dbQuery = dbQuery.is('deactivated_at', null)
  }

  const { data, error } = await dbQuery

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`)
  }

  return data as User[]
}

/**
 * Get user activity history
 * Returns recent ticket activities performed by a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param limit - Maximum number of activities to return (default: 50)
 * @returns List of ticket activities
 */
export async function getUserActivity(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string
    action: string
    old_value: string | null
    new_value: string | null
    metadata: Record<string, unknown>
    created_at: string
    ticket_id: string
    ticket: {
      id: string
      title: string
      status: string
    }
  }>
> {
  const { data, error } = await supabase
    .from('ticket_activities')
    .select(
      `
      id,
      action,
      old_value,
      new_value,
      metadata,
      created_at,
      ticket_id,
      tickets!inner(id, title, status)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch user activity: ${error.message}`)
  }

  // Transform the response to match expected structure
  return (data || []).map((activity) => {
    const tickets = activity.tickets as unknown as
      | { id: string; title: string; status: string }
      | { id: string; title: string; status: string }[]

    const ticket = Array.isArray(tickets) ? tickets[0] : tickets

    return {
      id: activity.id,
      action: activity.action,
      old_value: activity.old_value,
      new_value: activity.new_value,
      metadata: (activity.metadata || {}) as Record<string, unknown>,
      created_at: activity.created_at,
      ticket_id: activity.ticket_id,
      ticket: {
        id: ticket?.id || '',
        title: ticket?.title || '',
        status: ticket?.status || '',
      },
    }
  })
}

/**
 * Get user statistics
 * Returns summary statistics for a user (tickets created, assigned, resolved, etc.)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns User statistics
 */
export async function getUserStatistics(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  ticketsCreated: number
  ticketsAssigned: number
  ticketsResolved: number
  commentsPosted: number
  avgResolutionTime: number | null
}> {
  // Get tickets created by user
  const { count: ticketsCreated } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get tickets assigned to user
  const { count: ticketsAssigned } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', userId)

  // Get resolved tickets (where user was assigned)
  const { data: resolvedTickets } = await supabase
    .from('tickets')
    .select('created_at, resolved_at')
    .eq('assigned_to', userId)
    .in('status', ['resolved', 'closed'])
    .not('resolved_at', 'is', null)

  const ticketsResolved = resolvedTickets?.length || 0

  // Calculate average resolution time
  let avgResolutionTime: number | null = null
  if (resolvedTickets && resolvedTickets.length > 0) {
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at).getTime()
      const resolved = new Date(ticket.resolved_at!).getTime()
      return sum + (resolved - created)
    }, 0)
    avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
  }

  // Get comments posted by user
  const { count: commentsPosted } = await supabase
    .from('ticket_comments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    ticketsCreated: ticketsCreated || 0,
    ticketsAssigned: ticketsAssigned || 0,
    ticketsResolved,
    commentsPosted: commentsPosted || 0,
    avgResolutionTime,
  }
}

/**
 * Get unique departments from all users
 * Used for department filter dropdowns
 *
 * @param supabase - Supabase client
 * @returns List of unique departments
 */
export async function getDepartments(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('department')
    .not('department', 'is', null)
    .order('department', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch departments: ${error.message}`)
  }

  // Get unique departments
  const departments = [...new Set(data.map((row) => row.department).filter(Boolean))] as string[]

  return departments
}
