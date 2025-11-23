/**
 * Audit Log Queries
 *
 * Database query functions for retrieving ticket activity audit logs
 *
 * @module lib/audit/queries
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
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

type SupabaseClientType = SupabaseClient<Database>

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
    // Build query
    let query = supabase
      .from('ticket_activities')
      .select(
        `
        id,
        ticket_id,
        activity_type,
        performed_by,
        performed_at,
        field_name,
        old_value,
        new_value,
        comment,
        metadata,
        user:users!ticket_activities_performed_by_fkey(
          id,
          full_name,
          email,
          role
        ),
        ticket:tickets(
          id,
          title,
          ticket_number
        )
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (filters.startDate) {
      query = query.gte('performed_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('performed_at', filters.endDate)
    }

    if (filters.userId) {
      query = query.eq('performed_by', filters.userId)
    }

    if (filters.activityType) {
      if (Array.isArray(filters.activityType)) {
        query = query.in('activity_type', filters.activityType)
      } else {
        query = query.eq('activity_type', filters.activityType)
      }
    }

    if (filters.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
    }

    if (filters.search) {
      // Search in field_name, old_value, new_value, or comment
      const searchTerm = `%${filters.search}%`
      query = query.or(
        `field_name.ilike.${searchTerm},old_value.ilike.${searchTerm},new_value.ilike.${searchTerm},comment.ilike.${searchTerm}`
      )
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.order === 'asc' })

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

    // Transform data
    const logs: AuditLogEntry[] = (data || []).map((row) => ({
      id: row.id,
      ticket_id: row.ticket_id,
      activity_type: row.activity_type as ActivityType,
      performed_by: row.performed_by,
      performed_at: row.performed_at,
      field_name: row.field_name,
      old_value: row.old_value,
      new_value: row.new_value,
      comment: row.comment,
      metadata: row.metadata as Record<string, unknown> | null,
      user: row.user
        ? {
            id: (row.user as any).id,
            full_name: (row.user as any).full_name,
            email: (row.user as any).email,
            role: (row.user as any).role,
          }
        : null,
      ticket: row.ticket
        ? {
            id: (row.ticket as any).id,
            title: (row.ticket as any).title,
            ticket_number: (row.ticket as any).ticket_number,
          }
        : null,
    }))

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
      query = query.gte('performed_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('performed_at', filters.endDate)
    }

    // Get total count
    const { count: totalActivities } = await query

    // Get unique users count
    const { data: uniqueUsersData } = await supabase
      .from('ticket_activities')
      .select('performed_by')
    
    const uniqueUsers = new Set(uniqueUsersData?.map((row) => row.performed_by) || []).size

    // Get earliest and latest activity dates
    let dateQuery = supabase
      .from('ticket_activities')
      .select('performed_at')
      .order('performed_at', { ascending: true })
      .limit(1)

    if (filters.startDate) {
      dateQuery = dateQuery.gte('performed_at', filters.startDate)
    }
    if (filters.endDate) {
      dateQuery = dateQuery.lte('performed_at', filters.endDate)
    }

    const { data: earliestData } = await dateQuery
    const earliestActivity = earliestData?.[0]?.performed_at || null

    dateQuery = supabase
      .from('ticket_activities')
      .select('performed_at')
      .order('performed_at', { ascending: false })
      .limit(1)

    if (filters.startDate) {
      dateQuery = dateQuery.gte('performed_at', filters.startDate)
    }
    if (filters.endDate) {
      dateQuery = dateQuery.lte('performed_at', filters.endDate)
    }

    const { data: latestData } = await dateQuery
    const latestActivity = latestData?.[0]?.performed_at || null

    // Get activity type breakdown
    let activityQuery = supabase
      .from('ticket_activities')
      .select('activity_type')

    if (filters.startDate) {
      activityQuery = activityQuery.gte('performed_at', filters.startDate)
    }
    if (filters.endDate) {
      activityQuery = activityQuery.lte('performed_at', filters.endDate)
    }

    const { data: activityData } = await activityQuery

    const activityBreakdown = Object.entries(
      (activityData || []).reduce(
        (acc, row) => {
          const type = row.activity_type as ActivityType
          acc[type] = (acc[type] || 0) + 1
          return acc
        },
        {} as Record<ActivityType, number>
      )
    )
      .map(([type, count]) => ({
        type: type as ActivityType,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Get top 5 most active users
    let userActivityQuery = supabase
      .from('ticket_activities')
      .select(
        `
        performed_by,
        user:users!ticket_activities_performed_by_fkey(
          id,
          full_name,
          email
        )
      `
      )

    if (filters.startDate) {
      userActivityQuery = userActivityQuery.gte('performed_at', filters.startDate)
    }
    if (filters.endDate) {
      userActivityQuery = userActivityQuery.lte('performed_at', filters.endDate)
    }

    const { data: userActivityData } = await userActivityQuery

    const userActivityMap = (userActivityData || []).reduce(
      (acc, row) => {
        const userId = row.performed_by
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: (row.user as any)?.full_name || 'Unknown User',
            userEmail: (row.user as any)?.email || '',
            activityCount: 0,
          }
        }
        acc[userId].activityCount += 1
        return acc
      },
      {} as Record<
        string,
        {
          userId: string
          userName: string
          userEmail: string
          activityCount: number
        }
      >
    )

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
        'Ticket Number': log.ticket?.ticket_number || '',
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

