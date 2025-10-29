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
    
    // Calculate average response time (mock for now - requires ticket_activities)
    const avgResponseTime = '2.4h'
    
    // Get satisfaction rating (mock for now - requires ticket_feedback)
    const satisfaction = 4.8
    
    return {
      openTickets: openCount || 0,
      resolvedTickets: resolvedToday || 0,
      avgResponseTime,
      satisfaction,
      totalTickets: totalCount || 0,
      myTickets: !isStaff ? (totalCount || 0) : 0,
      assignedTickets: assignedCount,
      overdueTickets: 0, // TODO: Calculate based on created_at + SLA
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
    
    const counts = {
      total: tickets?.length || 0,
      open: tickets?.filter(t => t.status === 'open').length || 0,
      inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
      closed: tickets?.filter(t => t.status === 'closed').length || 0,
      overdue: 0, // TODO: Calculate based on created_at + SLA
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
