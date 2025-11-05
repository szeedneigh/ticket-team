/**
 * Dashboard Data Fetching Utilities
 * 
 * Server-side functions for fetching dashboard data with proper error handling
 * and caching. These functions will be used by dashboard pages and components.
 * 
 * @module lib/dashboard/queries
 */

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { logger } from '@/lib/logger'
import type {
  DashboardStats,
  Activity,
  ActivityType,
  UserTicketSummary,
  KBStats,
  DashboardData
} from '@/lib/types/dashboard'

/**
 * SLA thresholds in hours by priority
 */
const SLA_THRESHOLDS = {
  low: 48,      // 2 days
  medium: 24,   // 1 day
  high: 8,      // 8 hours
} as const

/**
 * Type for ticket comment with user info from join
 */
interface TicketCommentWithUser {
  created_at: string
  user_id: string
  users?: {
    role: string
  } | {
    role: string
  }[]
}

/**
 * Format duration in hours to human-readable string
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  } else if (hours < 24) {
    return `${hours.toFixed(1)}h`
  } else {
    const days = hours / 24
    return `${days.toFixed(1)}d`
  }
}

/**
 * Calculate average response time based on first staff comment
 *
 * @param userId - User ID to calculate for
 * @param isStaff - Whether user is staff
 * @returns Formatted average response time string
 */
async function calculateAvgResponseTime(userId: string, isStaff: boolean): Promise<string> {
  const supabase = await createClient()

  try {
    // Get tickets with their comments
    let ticketQuery = supabase
      .from('tickets')
      .select(`
        id,
        created_at,
        ticket_comments!inner(
          created_at,
          user_id,
          users!inner(role)
        )
      `)
      .in('status', ['resolved', 'closed'])

    if (!isStaff) {
      ticketQuery = ticketQuery.eq('user_id', userId)
    }

    const { data: tickets, error } = await ticketQuery

    if (error || !tickets || tickets.length === 0) {
      logger.error('Error fetching tickets for response time', { error: error?.message })
      return '-'
    }

    // Calculate time to first staff response for each ticket
    const responseTimes: number[] = []

    for (const ticket of tickets) {
      const ticketCreated = new Date(ticket.created_at).getTime()

      // Find first comment by staff
      const staffComments = (ticket.ticket_comments as TicketCommentWithUser[])
        .filter((comment) => {
          // Handle users as either object or array
          const users = comment.users
          const role = Array.isArray(users) ? users[0]?.role : users?.role
          return role === 'staff' || role === 'admin' || role === 'super_admin'
        })
        .sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

      if (staffComments.length > 0) {
        const firstStaffComment = staffComments[0]
        const commentTime = new Date(firstStaffComment.created_at).getTime()
        const responseTimeHours = (commentTime - ticketCreated) / (1000 * 60 * 60)
        responseTimes.push(responseTimeHours)
      }
    }

    if (responseTimes.length === 0) {
      return '-'
    }

    // Calculate average
    const avgHours = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    return formatDuration(avgHours)
  } catch (error) {
    logger.error('Error calculating response time', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return '-'
  }
}

/**
 * Calculate satisfaction score from feedback
 *
 * @param userId - User ID to calculate for
 * @param isStaff - Whether user is staff
 * @returns Average satisfaction rating (0-5)
 */
async function calculateSatisfactionScore(userId: string, isStaff: boolean): Promise<number> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('ticket_feedback')
      .select('rating, tickets!inner(user_id)')

    if (!isStaff) {
      // Filter to user's tickets only
      query = query.eq('tickets.user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching satisfaction scores', { error: error.message })
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    // Calculate average rating
    const avgRating = data.reduce((sum, f) => sum + f.rating, 0) / data.length
    return Math.round(avgRating * 10) / 10 // Round to 1 decimal
  } catch (error) {
    logger.error('Error calculating satisfaction', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return 0
  }
}

/**
 * Calculate number of overdue tickets based on SLA
 *
 * @param userId - User ID to calculate for
 * @param isStaff - Whether user is staff
 * @returns Count of overdue tickets
 */
async function calculateOverdueTickets(userId: string, isStaff: boolean): Promise<number> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('tickets')
      .select('id, priority, created_at, status')
      .in('status', ['open', 'in_progress'])

    if (!isStaff) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error || !data) {
      logger.error('Error fetching tickets for overdue calculation', { error: error?.message })
      return 0
    }

    // Check each ticket against SLA threshold
    const now = new Date().getTime()
    const overdueCount = data.filter(ticket => {
      const createdAt = new Date(ticket.created_at).getTime()
      const ageInHours = (now - createdAt) / (1000 * 60 * 60)
      const threshold = SLA_THRESHOLDS[ticket.priority as keyof typeof SLA_THRESHOLDS]
      return ageInHours > threshold
    }).length

    return overdueCount
  } catch (error) {
    logger.error('Error calculating overdue tickets', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return 0
  }
}

/**
 * Get dashboard statistics for the current user
 * 
 * @param userId - User ID to fetch stats for
 * @returns Dashboard statistics
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()
  
  try {
    // Get user info to determine their role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (userError) {
      logger.error('Error fetching user role', { error: userError.message, userId })
      throw new Error(`Failed to fetch user role: ${userError.message}`)
    }
    
    const isStaff = ['staff', 'admin', 'super_admin'].includes(userData?.role ?? '')
    
    // Get ticket counts based on user role
    let openTicketsQuery = supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
    
    // Employees only see their own tickets, staff see all
    if (!isStaff) {
      openTicketsQuery = openTicketsQuery.eq('user_id', userId)
    }
    
    const { count: openCount, error: openError } = await openTicketsQuery
    
    if (openError) {
      logger.error('Error fetching open tickets', { error: openError.message, userId })
      throw new Error(`Failed to fetch open tickets: ${openError.message}`)
    }
    
    // Get tickets resolved today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let resolvedTodayQuery = supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('resolved_at', today.toISOString())
    
    if (!isStaff) {
      resolvedTodayQuery = resolvedTodayQuery.eq('user_id', userId)
    }
    
    const { count: resolvedToday, error: resolvedError } = await resolvedTodayQuery
    
    if (resolvedError) {
      logger.error('Error fetching resolved tickets', { error: resolvedError.message, userId })
      // Don't throw, just log and continue with 0
    }
    
    // Get total tickets
    let totalTicketsQuery = supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
    
    if (!isStaff) {
      totalTicketsQuery = totalTicketsQuery.eq('user_id', userId)
    }
    
    const { count: totalCount, error: totalError } = await totalTicketsQuery
    
    if (totalError) {
      logger.error('Error fetching total tickets', { error: totalError.message, userId })
      // Don't throw, just log and continue
    }
    
    // Get tickets assigned to user (staff only)
    let assignedCount = 0
    if (isStaff) {
      const { count, error: assignedError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .in('status', ['open', 'in_progress'])
      
      if (assignedError) {
        logger.error('Error fetching assigned tickets', { error: assignedError.message, userId })
      } else {
        assignedCount = count || 0
      }
    }
    
    // Calculate real metrics
    const [avgResponseTime, satisfaction, overdueCount] = await Promise.all([
      calculateAvgResponseTime(userId, isStaff),
      calculateSatisfactionScore(userId, isStaff),
      calculateOverdueTickets(userId, isStaff),
    ])

    return {
      openTickets: openCount || 0,
      resolvedTickets: resolvedToday || 0,
      avgResponseTime,
      satisfaction,
      totalTickets: totalCount || 0,
      myTickets: !isStaff ? (totalCount || 0) : 0,
      assignedTickets: assignedCount,
      overdueTickets: overdueCount,
    }
  } catch (error) {
    logger.error('Error fetching dashboard stats', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId 
    })
    throw error instanceof Error ? error : new Error('Failed to fetch dashboard statistics')
  }
}

/**
 * Get recent activity for the current user
 * 
 * @param userId - User ID to fetch activity for
 * @param limit - Maximum number of activities to return
 * @returns Array of recent activities
 */
export async function getRecentActivity(userId: string, limit: number = 10): Promise<Activity[]> {
  try {
    // Use the real query function from activity-queries which already handles database queries
    const { getUserActivity } = await import('./activity-queries')
    const activities = await getUserActivity(userId, { limit })
    
    // Transform DashboardActivityItem to Activity format expected by dashboard types
    return activities.map(activity => ({
      id: activity.id,
      type: activity.type as ActivityType,
      description: activity.description || activity.title,
      timestamp: new Date(activity.createdAt),
      userId: activity.actorId,
      userName: 'Current User', // TODO: Fetch actual user name from database
    }))
  } catch (error) {
    logger.error('Error fetching recent activity', { error: error instanceof Error ? error.message : 'Unknown error' })
    return []
  }
}

/**
 * Get ticket summary for the current user
 * 
 * @param userId - User ID to fetch ticket summary for
 * @returns User ticket summary
 */
export async function getUserTicketSummary(userId: string): Promise<UserTicketSummary> {
  const supabase = await createClient()
  
  try {
    // Get ticket counts by status
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, status, user_id, assigned_to')
      .eq('user_id', userId)
    
    if (error) {
      logger.error('Error fetching ticket summary', { error: error.message })
      throw error
    }
    
    // Calculate overdue tickets
    const overdueCount = await calculateOverdueTickets(userId, false)

    const counts = {
      total: tickets?.length || 0,
      open: tickets?.filter(t => t.status === 'open').length || 0,
      inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
      closed: tickets?.filter(t => t.status === 'closed').length || 0,
      overdue: overdueCount,
    }
    
    // Get tickets assigned to user
    const { count: assignedCount, error: assignedError } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .in('status', ['open', 'in_progress'])
    
    if (assignedError) {
      logger.error('Error fetching assigned tickets', { error: assignedError.message })
    }
    
    return {
      ...counts,
      myTickets: counts.total,
      assignedToMe: assignedCount || 0,
    }
  } catch (error) {
    logger.error('Error fetching ticket summary', { error: error instanceof Error ? error.message : 'Unknown error' })
    throw new Error('Failed to fetch ticket summary')
  }
}

/**
 * Get knowledge base statistics
 * 
 * @returns Knowledge base statistics
 */
export async function getKBStats(): Promise<KBStats> {
  try {
    // Return empty stats for now - KB feature not yet implemented
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      mostViewed: [],
    }
  } catch (error) {
    logger.error('Error fetching KB stats', { error: error instanceof Error ? error.message : 'Unknown error' })
    // Return empty stats on error rather than crashing
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      mostViewed: [],
    }
  }
}

/**
 * Get complete dashboard data for the current user
 * 
 * @param userId - User ID to fetch dashboard data for
 * @returns Complete dashboard data
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    const [stats, recentActivity, ticketSummary, kbStats] = await Promise.all([
      getDashboardStats(userId),
      getRecentActivity(userId, 5),
      getUserTicketSummary(userId),
      getKBStats(),
    ])
    
    return {
      stats,
      recentActivity,
      ticketSummary,
      kbStats,
    }
  } catch (error) {
    logger.error('Error fetching dashboard data', { error: error instanceof Error ? error.message : 'Unknown error' })
    throw new Error('Failed to fetch dashboard data')
  }
}

/**
 * Get dashboard data for the current authenticated user
 * 
 * @returns Dashboard data for current user
 */
export async function getCurrentUserDashboardData(): Promise<DashboardData> {
  const user = await getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  return getDashboardData(user.id)
}
