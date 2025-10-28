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
import type { 
  DashboardStats, 
  Activity, 
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
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
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
    
    const { count: openCount } = await openTicketsQuery
    
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
    
    const { count: resolvedToday } = await resolvedTodayQuery
    
    // Get total tickets
    let totalTicketsQuery = supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
    
    if (!isStaff) {
      totalTicketsQuery = totalTicketsQuery.eq('user_id', userId)
    }
    
    const { count: totalCount } = await totalTicketsQuery
    
    // Get tickets assigned to user (staff only)
    let assignedCount = 0
    if (isStaff) {
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .in('status', ['open', 'in_progress'])
      
      assignedCount = count || 0
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
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Failed to fetch dashboard statistics')
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
  const supabase = await createClient()
  
  try {
    // For Phase 3C, return mock data
    // In Phase 4, this will query the ticket_activities table
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'ticket_created',
        description: 'Created ticket #1234: Email access issue',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        userId: userId,
        userName: 'Current User',
      },
      {
        id: '2',
        type: 'status_changed',
        description: 'Ticket #1230 status changed to "In Progress"',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        userId: userId,
        userName: 'Current User',
      },
      {
        id: '3',
        type: 'comment_added',
        description: 'Added comment to ticket #1228',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        userId: userId,
        userName: 'Current User',
      },
      {
        id: '4',
        type: 'ticket_updated',
        description: 'Updated ticket #1225: Added priority level',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        userId: userId,
        userName: 'Current User',
      },
    ]
    
    return mockActivities.slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    throw new Error('Failed to fetch recent activity')
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
    // For Phase 3C, return mock data
    // In Phase 4, this will query the tickets table with proper RLS
    return {
      total: 15,
      open: 3,
      inProgress: 2,
      resolved: 7,
      closed: 3,
      overdue: 1,
      myTickets: 3,
      assignedToMe: 2,
    }
  } catch (error) {
    console.error('Error fetching ticket summary:', error)
    throw new Error('Failed to fetch ticket summary')
  }
}

/**
 * Get knowledge base statistics
 * 
 * @returns Knowledge base statistics
 */
export async function getKBStats(): Promise<KBStats> {
  const supabase = await createClient()
  
  try {
    // For Phase 3C, return mock data
    // In Phase 4, this will query the knowledge_base table
    return {
      totalArticles: 45,
      publishedArticles: 42,
      draftArticles: 3,
      mostViewed: [
        { id: '1', title: 'How to Reset Password', views: 156 },
        { id: '2', title: 'Email Setup Guide', views: 134 },
        { id: '3', title: 'WiFi Connection Issues', views: 98 },
      ],
    }
  } catch (error) {
    console.error('Error fetching KB stats:', error)
    throw new Error('Failed to fetch knowledge base statistics')
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
    console.error('Error fetching dashboard data:', error)
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
