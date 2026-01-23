/**
 * Ticket Query Utilities
 *
 * Type-safe query builders for fetching tickets with filters and pagination.
 * Uses cursor-based pagination for optimal performance.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Ticket as _Ticket,
  TicketWithUser,
  TicketFilters,
  TicketComment as _TicketComment,
  TicketCommentWithUser,
  TicketActivity as _TicketActivity,
  TicketActivityWithUser,
  PagedTicketListResponse,
  TimePeriod as _TimePeriod,
} from '@/lib/types/tickets'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants'
import { getTimePeriodStartDate } from '@/lib/constants'

// Re-export types for convenience
export type { TicketFilters, TicketWithUser, TicketCommentWithUser, TicketActivityWithUser }

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
}

export interface TicketQueryOptions {
  cursor?: string
  limit?: number
  order?: 'asc' | 'desc'
  orderBy?: 'created_at' | 'updated_at' | 'priority'
}

// ============================================================================
// Ticket Queries
// ============================================================================

/**
 * Fetch tickets with filters and cursor-based pagination
 */
export async function getTickets(
  supabase: SupabaseClient,
  filters: TicketFilters = {},
  options: TicketQueryOptions = {}
): Promise<PaginatedResponse<TicketWithUser>> {
  const {
    cursor,
    limit = PAGINATION.DEFAULT_PAGE_SIZE,
    order = 'desc',
    orderBy = 'created_at',
  } = options

  // Ensure limit doesn't exceed max
  const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE)

  // Start building query
  let query = supabase
    .from('tickets')
    .select(`
      *,
      user:users!tickets_user_id_fkey(id, full_name, email, avatar_url),
      assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url)
    `)

  // Apply filters
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters.priority) {
    if (Array.isArray(filters.priority)) {
      query = query.in('priority', filters.priority)
    } else {
      query = query.eq('priority', filters.priority)
    }
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id)
  }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after)
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before)
  }

  // Apply cursor-based pagination
  if (cursor) {
    if (order === 'desc') {
      query = query.lt(orderBy, cursor)
    } else {
      query = query.gt(orderBy, cursor)
    }
  }

  // Apply ordering and limit
  query = query.order(orderBy, { ascending: order === 'asc' }).limit(safeLimit + 1)

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`)
  }

  // Check if there are more items
  const hasMore = data.length > safeLimit
  const items = hasMore ? data.slice(0, safeLimit) : data

  // Calculate cursors
  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1][orderBy]
    : null

  const prevCursor = items.length > 0 && cursor
    ? items[0][orderBy]
    : null

  return {
    items: items as TicketWithUser[],
    nextCursor,
    prevCursor,
    hasMore,
  }
}

/**
 * Fetch tickets with page-based pagination and time period filtering
 * @param supabase - Supabase client
 * @param filters - Filter criteria including timePeriod and page
 * @param pageSize - Number of items per page (default: 20)
 * @returns PagedTicketListResponse with tickets, totalPages, currentPage, totalCount
 */
export async function getTicketsPaged(
  supabase: SupabaseClient,
  filters: TicketFilters = {},
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PagedTicketListResponse> {
  const page = filters.page || 1
  const safeLimit = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE)
  const from = (page - 1) * safeLimit
  const to = from + safeLimit - 1

  // Build count query (for total pages calculation)
  let countQuery = supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })

  // Build data query
  let dataQuery = supabase
    .from('tickets')
    .select(`
      *,
      user:users!tickets_user_id_fkey(id, full_name, email, avatar_url),
      assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url)
    `)

  // Apply filters to both queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (query: any) => {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in('priority', filters.priority)
      } else {
        query = query.eq('priority', filters.priority)
      }
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Time period filter
    if (filters.timePeriod && filters.timePeriod !== 'all') {
      const startDate = getTimePeriodStartDate(filters.timePeriod)
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
    }

    // Date range filters (fallback if not using timePeriod)
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    return query
  }

  countQuery = applyFilters(countQuery)
  dataQuery = applyFilters(dataQuery)

  // Apply pagination and ordering to data query
  dataQuery = dataQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queries.ts:254',message:'getTicketsPaged: Query execution START',data:{filters,page,safeLimit,from,to},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion

  // Execute both queries
  const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
    countQuery,
    dataQuery,
  ])

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queries.ts:259',message:'getTicketsPaged: Query results received',data:{count,dataLength:data?.length,ticketIds:data?.map(t => t.id),hasDuplicateIds:data ? data.length !== new Set(data.map(t => t.id)).size : false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion

  if (countError) {
    throw new Error(`Failed to count tickets: ${countError.message}`)
  }

  if (dataError) {
    throw new Error(`Failed to fetch tickets: ${dataError.message}`)
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / safeLimit)

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queries.ts:276',message:'getTicketsPaged: Returning results',data:{totalCount,totalPages,currentPage:page,ticketsLength:(data || []).length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion

  return {
    tickets: (data || []) as TicketWithUser[],
    totalPages,
    currentPage: page,
    totalCount,
  }
}

/**
 * Fetch a single ticket by ID
 */
export async function getTicketById(
  supabase: SupabaseClient,
  ticketId: string
): Promise<TicketWithUser | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      user:users!tickets_user_id_fkey(id, full_name, email, avatar_url),
      assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url)
    `)
    .eq('id', ticketId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch ticket: ${error.message}`)
  }

  return data as TicketWithUser
}

/**
 * Fetch ticket with all relations (comments, activities, attachments)
 */
export async function getTicketWithRelations(
  supabase: SupabaseClient,
  ticketId: string
) {
  const [ticket, comments, activities] = await Promise.all([
    getTicketById(supabase, ticketId),
    getTicketComments(supabase, ticketId),
    getTicketActivities(supabase, ticketId),
  ])

  if (!ticket) {
    return null
  }

  return {
    ticket,
    comments,
    activities,
  }
}

// ============================================================================
// Comment Queries
// ============================================================================

/**
 * Fetch comments for a ticket with cursor-based pagination
 * RLS policies automatically filter internal notes based on user role
 */
export async function getTicketComments(
  supabase: SupabaseClient,
  ticketId: string,
  options: TicketQueryOptions = {}
): Promise<PaginatedResponse<TicketCommentWithUser>> {
  const {
    cursor,
    limit = PAGINATION.COMMENTS_PAGE_SIZE,
    order = 'asc',
    orderBy = 'created_at',
  } = options

  const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE)

  let query = supabase
    .from('ticket_comments')
    .select(`
      *,
      user:users!ticket_comments_user_id_fkey(id, full_name, email, avatar_url, role)
    `)
    .eq('ticket_id', ticketId)

  // Apply cursor-based pagination
  if (cursor) {
    if (order === 'desc') {
      query = query.lt(orderBy, cursor)
    } else {
      query = query.gt(orderBy, cursor)
    }
  }

  query = query.order(orderBy, { ascending: order === 'asc' }).limit(safeLimit + 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ticket comments:', error)
    // Return empty result instead of throwing to prevent page crash
    return {
      items: [],
      nextCursor: null,
      prevCursor: null,
      hasMore: false,
    }
  }

  if (!data) {
    return {
      items: [],
      nextCursor: null,
      prevCursor: null,
      hasMore: false,
    }
  }

  const hasMore = data.length > safeLimit
  const items = hasMore ? data.slice(0, safeLimit) : data

  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1][orderBy]
    : null

  const prevCursor = items.length > 0 && cursor
    ? items[0][orderBy]
    : null

  return {
    items: items as TicketCommentWithUser[],
    nextCursor,
    prevCursor,
    hasMore,
  }
}

// ============================================================================
// Activity Queries
// ============================================================================

/**
 * Fetch activities for a ticket
 */
export async function getTicketActivities(
  supabase: SupabaseClient,
  ticketId: string,
  limit = 50
): Promise<TicketActivityWithUser[]> {
  const { data, error } = await supabase
    .from('ticket_activities')
    .select(`
      *,
      user:users(id, full_name, avatar_url)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching ticket activities:', error)
    // Return empty array instead of throwing to prevent page crash
    return []
  }

  if (!data) {
    return []
  }

  return data as TicketActivityWithUser[]
}

// ============================================================================
// Staff Queue Queries
// ============================================================================

/**
 * Fetch unassigned tickets for staff queue
 */
export async function getUnassignedTickets(
  supabase: SupabaseClient,
  options: TicketQueryOptions = {}
): Promise<PaginatedResponse<TicketWithUser>> {
  return getTickets(
    supabase,
    {
      status: ['open', 'in_progress'],
      assigned_to: undefined, // This will be handled by checking for null
    },
    options
  )
}

/**
 * Fetch tickets assigned to a specific staff member
 */
export async function getAssignedTickets(
  supabase: SupabaseClient,
  staffId: string,
  options: TicketQueryOptions = {}
): Promise<PaginatedResponse<TicketWithUser>> {
  return getTickets(
    supabase,
    {
      status: ['open', 'in_progress', 'on_hold'],
      assigned_to: staffId,
    },
    options
  )
}

// ============================================================================
// Ticket Statistics
// ============================================================================

/**
 * Get ticket count by status
 */
export async function getTicketCountByStatus(
  supabase: SupabaseClient,
  userId?: string
): Promise<Record<TicketStatus, number>> {
  // Use single aggregated query instead of multiple queries
  let query = supabase
    .from('tickets')
    .select('status')

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ticket counts by status:', error)
    return {
      open: 0,
      in_progress: 0,
      on_hold: 0,
      resolved: 0,
      closed: 0,
      canceled: 0,
    }
  }

  // Aggregate counts client-side (more efficient than 6 separate queries)
  const counts: Record<string, number> = {
    open: 0,
    in_progress: 0,
    on_hold: 0,
    resolved: 0,
    closed: 0,
    canceled: 0,
  }

  data?.forEach((ticket) => {
    if (ticket.status in counts) {
      counts[ticket.status]++
    }
  })

  return counts as Record<TicketStatus, number>
}

/**
 * Get ticket count by priority
 */
export async function getTicketCountByPriority(
  supabase: SupabaseClient,
  userId?: string
): Promise<Record<TicketPriority, number>> {
  // Use single aggregated query instead of multiple queries
  let query = supabase
    .from('tickets')
    .select('priority')

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ticket counts by priority:', error)
    return {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
      critical: 0,
    }
  }

  // Aggregate counts client-side (more efficient than 3 separate queries)
  const counts: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
    critical: 0,
  }

  data?.forEach((ticket) => {
    if (ticket.priority in counts) {
      counts[ticket.priority]++
    }
  })

  return counts as Record<TicketPriority, number>
}

// ============================================================================
// Feedback Queries
// ============================================================================

/**
 * Check if user has submitted feedback for a ticket
 */
export async function getTicketFeedbackByUser(
  supabase: SupabaseClient,
  ticketId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('ticket_feedback')
    .select('id')
    .eq('ticket_id', ticketId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch feedback: ${error.message}`)
  }

  return !!data
}

// ============================================================================
// Category Queries
// ============================================================================

export interface Category {
  id: string
  name: string
  parent_id: string | null
  type: string
  is_active: boolean
  created_at: string
}

/**
 * Fetch all active categories (parent categories only)
 */
export async function getCategories(
  supabase: SupabaseClient
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data as Category[]
}

/**
 * Fetch subcategories for a parent category
 */
export async function getSubcategories(
  supabase: SupabaseClient,
  parentId: string
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch subcategories: ${error.message}`)
  }

  return data as Category[]
}

/**
 * Fetch all categories with their subcategories
 */
export async function getCategoriesWithSubcategories(
  supabase: SupabaseClient
): Promise<(Category & { subcategories: Category[] })[]> {
  const categories = await getCategories(supabase)

  const categoriesWithSubs = await Promise.all(
    categories.map(async (category) => {
      const subcategories = await getSubcategories(supabase, category.id)
      return {
        ...category,
        subcategories,
      }
    })
  )

  return categoriesWithSubs
}
