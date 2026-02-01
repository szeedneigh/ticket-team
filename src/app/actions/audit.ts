/**
 * Server Actions for Audit Log
 *
 * Parallelized data fetching for audit log page (eliminates sequential waterfalls).
 *
 * @module app/actions/audit
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'
import { getAuditLogs, getAuditLogStats } from '@/lib/audit/queries'
import type {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogPagination,
  AuditLogSort,
  AuditLogStats,
} from '@/lib/types/audit'

export interface AuditLogPageData {
  logs: AuditLogEntry[]
  pagination: AuditLogPagination
  stats: AuditLogStats
  users: { id: string; full_name: string; email: string }[]
}

export interface GetAuditLogPageDataResult {
  success: boolean
  data?: AuditLogPageData
  error?: string
}

/**
 * Get audit log page data (logs, pagination, stats, users) in a single parallel fetch.
 * Eliminates sequential waterfalls: auth check -> users -> logs/stats.
 */
export async function getAuditLogPageData(
  filters: AuditLogFilters = {},
  page: number = 1,
  perPage: number = 50,
  sort: AuditLogSort = { field: 'performed_at', order: 'desc' }
): Promise<GetAuditLogPageDataResult> {
  try {
    const user = await requireAuth()

    // Verify admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    // Fetch logs, stats, and users in parallel
    const [logsResult, stats, usersResult] = await Promise.all([
      getAuditLogs(supabase, filters, page, perPage, sort),
      getAuditLogStats(supabase, filters),
      supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name'),
    ])

    const usersError = usersResult.error
    if (usersError) {
      console.error('Error fetching users for audit:', usersError)
      return { success: false, error: usersError.message }
    }

    return {
      success: true,
      data: {
        logs: logsResult.logs,
        pagination: logsResult.pagination,
        stats,
        users: (usersResult.data || []).map((u) => ({
          id: u.id,
          full_name: u.full_name ?? '',
          email: u.email ?? '',
        })),
      },
    }
  } catch (error) {
    console.error('Error fetching audit log page data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load audit logs',
    }
  }
}
