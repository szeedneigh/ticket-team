/**
 * Audit Log Queries
 *
 * Database query functions for retrieving ticket activity audit logs
 *
 * @module lib/audit/queries
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogResult,
  AuditLogStats,
  AuditLogSort,
  AuditLogCSVRow,
  ActivityType,
} from '@/lib/types/audit'
import { getActivityTypeLabel } from '@/lib/types/audit'
import { logger } from '@/lib/logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = SupabaseClient<any>

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get paginated audit logs with filters and sorting
 *
 * @param supabase - Supabase client
 * @param filters - Filter criteria
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @param sort - Sort configuration
 * @returns Audit log entries with pagination info
 */
export async function getAuditLogs(
  supabase: SupabaseClientType,
  filters: AuditLogFilters = {},
  page: number = 1,
  perPage: number = 50,
  sort: AuditLogSort = { field: 'performed_at', order: 'desc' }
): Promise<AuditLogResult> {
  try {
    // Build query - using simple join syntax for foreign keys
    let query = supabase
      .from('ticket_activities')
      .select(
        `
        id,
        ticket_id,
        action,
        user_id,
        created_at,
        old_value,
        new_value,
        metadata,
        user:users(
          id,
          full_name,
          email,
          role
        ),
        ticket:tickets(
          id,
          title,
          display_number
        )
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.activityType) {
      if (Array.isArray(filters.activityType)) {
        query = query.in('action', filters.activityType)
      } else {
        query = query.eq('action', filters.activityType)
      }
    }

    if (filters.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
    }

    if (filters.search) {
      // Search in action, old_value, new_value
      const searchTerm = `%${filters.search}%`
      query = query.or(
        `action.ilike.${searchTerm},old_value.ilike.${searchTerm},new_value.ilike.${searchTerm}`
      )
    }

    // Apply sorting - map sort field to actual DB column
    const sortFieldMap: Record<string, string> = {
      'performed_at': 'created_at',
      'activity_type': 'action',
      'performed_by': 'user_id',
      'ticket_id': 'ticket_id'
    }
    const dbSortField = sortFieldMap[sort.field] || 'created_at'
    query = query.order(dbSortField, { ascending: sort.order === 'asc' })

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching audit logs', { error: error.message, filters })
      throw error
    }

    // Transform data - map DB columns to expected interface
    // Supabase nested selects can return arrays or objects depending on relationship
    type TicketActivityRow = {
      id: string
      ticket_id: string
      action: string
      user_id: string | null
      created_at: string
      old_value: string | null
      new_value: string | null
      metadata: Record<string, unknown> | null
      user: {
        id: string
        full_name: string
        email: string
        role: string
      }[] | {
        id: string
        full_name: string
        email: string
        role: string
      } | null
      ticket: {
        id: string
        title: string
        display_number?: string
      }[] | {
        id: string
        title: string
        display_number?: string
      } | null
    }

    const logs: AuditLogEntry[] = (data || []).map((row) => {
      const activity = row as unknown as TicketActivityRow
      // Handle both array and object responses from Supabase nested queries
      const userData = Array.isArray(activity.user) ? activity.user[0] : activity.user
      const ticketData = Array.isArray(activity.ticket) ? activity.ticket[0] : activity.ticket
      return {
        id: activity.id,
        ticket_id: activity.ticket_id,
        activity_type: activity.action as ActivityType,
        performed_by: activity.user_id,
        performed_at: activity.created_at,
        field_name: null, // Not in current schema
        old_value: activity.old_value,
        new_value: activity.new_value,
        comment: null, // Not in current schema
        metadata: activity.metadata,
        user: userData
          ? {
            id: userData.id,
            full_name: userData.full_name,
            email: userData.email,
            role: userData.role,
          }
          : null,
        ticket: ticketData
          ? {
            id: ticketData.id,
            title: ticketData.title,
            display_number: ticketData.display_number,
          }
          : null,
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / perPage)

    return {
      logs,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    }
  } catch (error) {
    logger.error('Error in getAuditLogs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filters,
    })
    throw error
  }
}

/**
 * Get audit log statistics
 *
 * @param supabase - Supabase client
 * @param filters - Optional filter criteria (e.g., date range)
 * @returns Statistics about audit logs
 */
export async function getAuditLogStats(
  supabase: SupabaseClientType,
  filters: AuditLogFilters = {}
): Promise<AuditLogStats> {
  try {
    // Build base query
    let query = supabase.from('ticket_activities').select('*', { count: 'exact', head: true })

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    // Get total count
    const { count: totalActivities } = await query

    // Get unique users count
    const { data: uniqueUsersData } = await supabase
      .from('ticket_activities')
      .select('user_id')

    const uniqueUsers = new Set((uniqueUsersData || []).map((row) => row.user_id) || []).size

    // Get earliest and latest activity dates
    let dateQuery = supabase
      .from('ticket_activities')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)

    if (filters.startDate) {
      dateQuery = dateQuery.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      dateQuery = dateQuery.lte('created_at', filters.endDate)
    }

    const { data: earliestData } = await dateQuery
    type CreatedAtRow = { created_at: string }
    const earliestRow = (earliestData as CreatedAtRow[] | null)?.[0]
    const earliestActivity = earliestRow?.created_at || null

    dateQuery = supabase
      .from('ticket_activities')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (filters.startDate) {
      dateQuery = dateQuery.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      dateQuery = dateQuery.lte('created_at', filters.endDate)
    }

    const { data: latestData } = await dateQuery
    const latestRow = (latestData as CreatedAtRow[] | null)?.[0]
    const latestActivity = latestRow?.created_at || null

    // Get activity type breakdown
    let activityQuery = supabase
      .from('ticket_activities')
      .select('action')

    if (filters.startDate) {
      activityQuery = activityQuery.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      activityQuery = activityQuery.lte('created_at', filters.endDate)
    }

    const { data: activityData } = await activityQuery

    const activityCounts = (activityData || []).reduce<Record<ActivityType, number>>((acc, row) => {
      const type = row.action as ActivityType
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<ActivityType, number>)

    const activityBreakdown = Object.entries(activityCounts)
      .map(([type, count]) => ({
        type: type as ActivityType,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)

    // Get top 5 most active users
    let userActivityQuery = supabase
      .from('ticket_activities')
      .select(
        `
        user_id,
        user:users(
          id,
          full_name,
          email
        )
      `
      )

    if (filters.startDate) {
      userActivityQuery = userActivityQuery.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      userActivityQuery = userActivityQuery.lte('created_at', filters.endDate)
    }

    const { data: userActivityData } = await userActivityQuery

    type UserActivityRow = {
      user_id: string
      user: {
        id: string
        full_name: string | null
        email: string | null
      }[] | {
        id: string
        full_name: string | null
        email: string | null
      } | null
    }

    type UserActivitySummary = {
      userId: string
      userName: string
      userEmail: string
      activityCount: number
    }

    const userActivityMap = (userActivityData || []).reduce<
      Record<string, UserActivitySummary>
    >((acc, rawRow) => {
      const row = rawRow as unknown as UserActivityRow
      const userId = row.user_id
      // Handle both array and object responses from Supabase nested queries
      const userData = Array.isArray(row.user) ? row.user[0] : row.user
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: userData?.full_name || 'Unknown User',
          userEmail: userData?.email || '',
          activityCount: 0,
        }
      }
      acc[userId].activityCount += 1
      return acc
    }, {})

    const topUsers = Object.values(userActivityMap)
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 5)

    return {
      totalActivities: totalActivities || 0,
      uniqueUsers,
      earliestActivity,
      latestActivity,
      activityBreakdown,
      topUsers,
    }
  } catch (error) {
    logger.error('Error in getAuditLogStats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Export audit logs to CSV format
 *
 * @param supabase - Supabase client
 * @param filters - Filter criteria
 * @returns CSV data as array of rows
 */
export async function exportAuditLogsCSV(
  supabase: SupabaseClientType,
  filters: AuditLogFilters = {}
): Promise<AuditLogCSVRow[]> {
  try {
    // Fetch all logs matching filters (no pagination for export)
    const result = await getAuditLogs(supabase, filters, 1, 10000, {
      field: 'performed_at',
      order: 'desc',
    })

    // Transform to CSV rows
    const csvRows: AuditLogCSVRow[] = result.logs.map((log) => {
      const date = new Date(log.performed_at)
      return {
        Date: date.toLocaleDateString(),
        Time: date.toLocaleTimeString(),
        User: log.user?.full_name || 'Unknown User',
        Email: log.user?.email || '',
        'Ticket Number': log.ticket?.display_number || log.ticket?.id || '',
        'Ticket Title': log.ticket?.title || '',
        Action: getActivityTypeLabel(log.activity_type),
        Field: log.field_name || '',
        'Old Value': log.old_value || '',
        'New Value': log.new_value || '',
        Comment: log.comment || '',
      }
    })

    return csvRows
  } catch (error) {
    logger.error('Error in exportAuditLogsCSV', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Get audit logs for a specific ticket
 *
 * @param supabase - Supabase client
 * @param ticketId - Ticket ID
 * @param limit - Maximum number of logs to return
 * @returns Audit log entries for the ticket
 */
export async function getTicketAuditLogs(
  supabase: SupabaseClientType,
  ticketId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const result = await getAuditLogs(
      supabase,
      { ticketId },
      1,
      limit,
      { field: 'performed_at', order: 'desc' }
    )

    return result.logs
  } catch (error) {
    logger.error('Error in getTicketAuditLogs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId,
    })
    throw error
  }
}

/**
 * Get audit logs for a specific user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param limit - Maximum number of logs to return
 * @returns Audit log entries performed by the user
 */
export async function getUserAuditLogs(
  supabase: SupabaseClientType,
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const result = await getAuditLogs(
      supabase,
      { userId },
      1,
      limit,
      { field: 'performed_at', order: 'desc' }
    )

    return result.logs
  } catch (error) {
    logger.error('Error in getUserAuditLogs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get recent audit logs (last 7 days)
 *
 * @param supabase - Supabase client
 * @param days - Number of days to look back (default 7)
 * @param limit - Maximum number of logs to return
 * @returns Recent audit log entries
 */
export async function getRecentAuditLogs(
  supabase: SupabaseClientType,
  days: number = 7,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const result = await getAuditLogs(
      supabase,
      { startDate: startDate.toISOString() },
      1,
      limit,
      { field: 'performed_at', order: 'desc' }
    )

    return result.logs
  } catch (error) {
    logger.error('Error in getRecentAuditLogs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      days,
    })
    throw error
  }
}

