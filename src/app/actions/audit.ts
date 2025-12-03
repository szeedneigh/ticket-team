/**
 * Audit Logs Server Actions
 *
 * Server-side actions for fetching and exporting audit logs
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export interface AuditLog {
  id: string
  ticket_id: string
  ticket_title?: string
  user_id: string | null
  user_name: string | null
  action: string
  old_value: string | null
  new_value: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AuditLogsFilters {
  userId?: string
  action?: string
  ticketId?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface AuditLogsResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// Get Audit Logs
// ============================================================================

/**
 * Get audit logs with filters and pagination
 */
export async function getAuditLogs(
  filters: AuditLogsFilters = {}
): Promise<{ success: boolean; data?: AuditLogsResponse; error?: string }> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    // Default pagination
    const page = filters.page || 1
    const limit = filters.limit || 50
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('ticket_activities')
      .select(
        `
        id,
        ticket_id,
        user_id,
        action,
        old_value,
        new_value,
        metadata,
        created_at,
        tickets!inner(title),
        users(full_name)
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters.search) {
      query = query.or(
        `action.ilike.%${filters.search}%,old_value.ilike.%${filters.search}%,new_value.ilike.%${filters.search}%`
      )
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: activities, error, count } = await query

    if (error) {
      logger.error('Error fetching audit logs', { error: error.message })
      return { success: false, error: error.message }
    }

    // Transform data
    const auditLogs: AuditLog[] = (activities || []).map((activity: any) => ({
      id: activity.id,
      ticket_id: activity.ticket_id,
      ticket_title: activity.tickets?.title || 'Unknown',
      user_id: activity.user_id,
      user_name: activity.users?.full_name || 'System',
      action: activity.action,
      old_value: activity.old_value,
      new_value: activity.new_value,
      metadata: activity.metadata || {},
      created_at: activity.created_at,
    }))

    return {
      success: true,
      data: {
        data: auditLogs,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  } catch (error) {
    logger.error('Error fetching audit logs', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
    }
  }
}

/**
 * Get unique action types for filter dropdown
 */
export async function getAuditActionTypes(): Promise<{
  success: boolean
  data?: string[]
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ticket_activities')
      .select('action')
      .order('action')

    if (error) {
      logger.error('Error fetching action types', { error: error.message })
      return { success: false, error: error.message }
    }

    // Get unique actions
    const uniqueActions = [...new Set(data.map((item) => item.action))].filter(Boolean)

    return { success: true, data: uniqueActions }
  } catch (error) {
    logger.error('Error fetching action types', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch action types',
    }
  }
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(
  filters: AuditLogsFilters = {}
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    // Fetch all logs (no pagination limit)
    const result = await getAuditLogs({ ...filters, limit: 10000 })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch audit logs' }
    }

    // Convert to CSV
    const headers = [
      'Timestamp',
      'Ticket ID',
      'Ticket Title',
      'User',
      'Action',
      'Old Value',
      'New Value',
    ]

    const rows = result.data.data.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.ticket_id.slice(0, 8),
      log.ticket_title || 'Unknown',
      log.user_name || 'System',
      log.action,
      log.old_value || '',
      log.new_value || '',
    ])

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return { success: true, data: csvContent }
  } catch (error) {
    logger.error('Error exporting audit logs', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export audit logs',
    }
  }
}
