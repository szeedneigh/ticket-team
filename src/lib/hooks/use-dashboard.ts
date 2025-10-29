/**
 * Dashboard Custom Hooks
 * 
 * Client-side hooks for dashboard data management and state.
 * These hooks provide a clean interface for components to access dashboard data.
 * 
 * @module lib/hooks/use-dashboard
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/lib/hooks/use-user'
import type { 
  DashboardStats, 
  Activity, 
  UserTicketSummary, 
  KBStats,
  DashboardData 
} from '@/lib/types/dashboard'

interface UseDashboardStatsReturn {
  data: DashboardStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseRecentActivityReturn {
  data: Activity[] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseTicketSummaryReturn {
  data: UserTicketSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseKBStatsReturn {
  data: KBStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseDashboardDataReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching dashboard statistics
 * 
 * @returns Dashboard stats data and loading state
 */
export function useDashboardStats(): UseDashboardStatsReturn {
  const { user } = useUser()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // For Phase 3C, use mock data
      // In Phase 4, this will call the actual API
      const mockStats: DashboardStats = {
        openTickets: 3,
        resolvedTickets: 7,
        avgResponseTime: '2.4h',
        satisfaction: 4.8,
        totalTickets: 15,
        myTickets: 3,
        assignedTickets: 2,
        overdueTickets: 1,
      }
      
      setData(mockStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

/**
 * Hook for fetching recent activity
 * 
 * @param limit - Maximum number of activities to fetch
 * @returns Recent activity data and loading state
 */
export function useRecentActivity(limit: number = 10): UseRecentActivityReturn {
  const { user } = useUser()
  const [data, setData] = useState<Activity[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // For Phase 3C, use mock data
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'ticket_created',
          description: 'Created ticket #1234: Email access issue',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          userId: user.id,
          userName: user.full_name || 'User',
        },
        {
          id: '2',
          type: 'status_changed',
          description: 'Ticket #1230 status changed to "In Progress"',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          userId: user.id,
          userName: user.full_name || 'User',
        },
        {
          id: '3',
          type: 'comment_added',
          description: 'Added comment to ticket #1228',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          userId: user.id,
          userName: user.full_name || 'User',
        },
      ]
      
      setData(mockActivities.slice(0, limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity')
    } finally {
      setLoading(false)
    }
  }, [user, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

/**
 * Hook for fetching ticket summary
 * 
 * @returns Ticket summary data and loading state
 */
export function useTicketSummary(): UseTicketSummaryReturn {
  const { user } = useUser()
  const [data, setData] = useState<UserTicketSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // For Phase 3C, use mock data
      const mockSummary: UserTicketSummary = {
        total: 15,
        open: 3,
        inProgress: 2,
        resolved: 7,
        closed: 3,
        overdue: 1,
        myTickets: 3,
        assignedToMe: 2,
      }
      
      setData(mockSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket summary')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

/**
 * Hook for fetching knowledge base statistics
 * 
 * @returns KB stats data and loading state
 */
export function useKBStats(): UseKBStatsReturn {
  const [data, setData] = useState<KBStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // For Phase 3C, use mock data
      const mockKBStats: KBStats = {
        totalArticles: 45,
        publishedArticles: 42,
        draftArticles: 3,
        mostViewed: [
          { id: '1', title: 'How to Reset Password', views: 156 },
          { id: '2', title: 'Email Setup Guide', views: 134 },
          { id: '3', title: 'WiFi Connection Issues', views: 98 },
        ],
      }
      
      setData(mockKBStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KB stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

/**
 * Hook for fetching complete dashboard data
 * 
 * @returns Complete dashboard data and loading state
 */
export function useDashboardData(): UseDashboardDataReturn {
  const { user } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // For Phase 3C, use mock data
      // In Phase 4, this will call the actual API endpoint
      const mockDashboardData: DashboardData = {
        stats: {
          openTickets: 3,
          resolvedTickets: 7,
          avgResponseTime: '2.4h',
          satisfaction: 4.8,
          totalTickets: 15,
          myTickets: 3,
          assignedTickets: 2,
          overdueTickets: 1,
        },
        recentActivity: [
          {
            id: '1',
            type: 'ticket_created',
            description: 'Created ticket #1234: Email access issue',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            userId: user.id,
            userName: user.full_name || 'User',
          },
          {
            id: '2',
            type: 'status_changed',
            description: 'Ticket #1230 status changed to "In Progress"',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            userId: user.id,
            userName: user.full_name || 'User',
          },
        ],
        ticketSummary: {
          total: 15,
          open: 3,
          inProgress: 2,
          resolved: 7,
          closed: 3,
          overdue: 1,
          myTickets: 3,
          assignedToMe: 2,
        },
        kbStats: {
          totalArticles: 45,
          publishedArticles: 42,
          draftArticles: 3,
          mostViewed: [
            { id: '1', title: 'How to Reset Password', views: 156 },
            { id: '2', title: 'Email Setup Guide', views: 134 },
            { id: '3', title: 'WiFi Connection Issues', views: 98 },
          ],
        },
      }
      
      setData(mockDashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
