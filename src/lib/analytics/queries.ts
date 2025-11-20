/**
 * Analytics Query Functions
 *
 * Advanced analytics queries for reporting and dashboards.
 * All queries enforce RLS and are accessible only to admin/super_admin roles.
 *
 * @module lib/analytics/queries
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type {
  AnalyticsSummary,
  TrendData,
  TimeGranularity,
  CategoryDistribution,
  PriorityDistribution,
  StatusDistribution,
  StaffPerformance,
  PeakHoursData,
  SLACompliance,
  SatisfactionBreakdown,
  AnalyticsReport,
  AnalyticsFilters,
  DateRange,
  AIAnalyticsData,
  AIAnalyticsSummary,
  AIVolumeTrend,
  CommonQuery,
} from '@/lib/types/analytics'

/**
 * SLA thresholds in hours by priority
 */
const SLA_THRESHOLDS = {
  low: 48, // 2 days
  medium: 24, // 1 day
  high: 8, // 8 hours
} as const

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
 * Get default date range (last 30 days)
 */
function getDefaultDateRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return { start, end }
}

/**
 * Verify user has admin or super_admin role
 */
async function verifyAdminRole(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    logger.error('Error verifying admin role', { error: error?.message, userId })
    return false
  }

  return ['admin', 'super_admin'].includes(data.role)
}

/**
 * Get analytics summary with KPI metrics
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Analytics summary
 */
export async function getAnalyticsSummary(
  userId: string,
  dateRange?: DateRange
): Promise<AnalyticsSummary> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    // Get ticket counts
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, priority, created_at, resolved_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())

    if (ticketsError) {
      throw new Error(`Failed to fetch tickets: ${ticketsError.message}`)
    }

    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter((t) => t.status === 'open').length || 0
    const resolvedTickets = tickets?.filter((t) => t.status === 'resolved').length || 0
    const closedTickets = tickets?.filter((t) => t.status === 'closed').length || 0

    // Calculate resolution time
    const resolvedWithTime = tickets?.filter(
      (t) => t.resolved_at && (t.status === 'resolved' || t.status === 'closed')
    )
    let avgResolutionTimeHours = 0
    if (resolvedWithTime && resolvedWithTime.length > 0) {
      const totalResolutionTime = resolvedWithTime.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at).getTime()
        const resolved = new Date(ticket.resolved_at!).getTime()
        return sum + (resolved - created) / (1000 * 60 * 60)
      }, 0)
      avgResolutionTimeHours = totalResolutionTime / resolvedWithTime.length
    }

    // Calculate response time (time to first staff comment)
    const ticketIds = tickets?.map((t) => t.id) || []
    let avgResponseTimeHours = 0
    if (ticketIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('ticket_comments')
        .select('ticket_id, created_at, tickets!inner(created_at), users!inner(role)')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true })

      if (!commentsError && comments) {
        const responseTimes: number[] = []
        const processedTickets = new Set<string>()

        for (const comment of comments) {
          if (processedTickets.has(comment.ticket_id)) continue

          const users = comment.users as unknown as { role: string } | { role: string }[]
          const role = Array.isArray(users) ? users[0]?.role : users?.role

          if (['staff', 'admin', 'super_admin'].includes(role || '')) {
            const ticketData = comment.tickets as unknown as { created_at: string }
            const ticketCreated = new Date(
              Array.isArray(ticketData) ? ticketData[0].created_at : ticketData.created_at
            ).getTime()
            const commentTime = new Date(comment.created_at).getTime()
            const responseTime = (commentTime - ticketCreated) / (1000 * 60 * 60)
            responseTimes.push(responseTime)
            processedTickets.add(comment.ticket_id)
          }
        }

        if (responseTimes.length > 0) {
          avgResponseTimeHours =
            responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        }
      }
    }

    // Calculate satisfaction score
    const { data: feedback, error: feedbackError } = await supabase
      .from('ticket_feedback')
      .select('rating, tickets!inner(created_at)')
      .gte('tickets.created_at', range.start.toISOString())
      .lte('tickets.created_at', range.end.toISOString())

    let satisfactionScore = 0
    if (!feedbackError && feedback && feedback.length > 0) {
      const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
      satisfactionScore = Math.round(avgRating * 10) / 10
    }

    // Calculate resolution rate
    const resolutionRate =
      totalTickets > 0 ? Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100) : 0

    // Calculate SLA compliance
    let slaCompliance = 0
    if (resolvedWithTime && resolvedWithTime.length > 0) {
      const withinSLA = resolvedWithTime.filter((ticket) => {
        const created = new Date(ticket.created_at).getTime()
        const resolved = new Date(ticket.resolved_at!).getTime()
        const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60)
        const threshold = SLA_THRESHOLDS[ticket.priority as keyof typeof SLA_THRESHOLDS]
        return resolutionTimeHours <= threshold
      }).length

      slaCompliance = Math.round((withinSLA / resolvedWithTime.length) * 100)
    }

    // Calculate overdue tickets
    const now = new Date().getTime()
    const overdueTickets =
      tickets?.filter((ticket) => {
        if (ticket.status === 'resolved' || ticket.status === 'closed') return false
        const created = new Date(ticket.created_at).getTime()
        const ageInHours = (now - created) / (1000 * 60 * 60)
        const threshold = SLA_THRESHOLDS[ticket.priority as keyof typeof SLA_THRESHOLDS]
        return ageInHours > threshold
      }).length || 0

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      avgResolutionTime: formatDuration(avgResolutionTimeHours),
      avgResolutionTimeHours,
      avgResponseTime: formatDuration(avgResponseTimeHours),
      avgResponseTimeHours,
      satisfactionScore,
      resolutionRate,
      slaCompliance,
      overdueTickets,
      period: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    }
  } catch (error) {
    logger.error('Error fetching analytics summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get ticket volume trends over time
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @param granularity - Time granularity (daily, weekly, monthly)
 * @returns Trend data
 */
export async function getTicketTrends(
  userId: string,
  dateRange?: DateRange,
  granularity: TimeGranularity = 'daily'
): Promise<TrendData> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    // Fetch all tickets in date range
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, created_at, status, resolved_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch ticket trends: ${error.message}`)
    }

    // Group tickets by time period
    const ticketVolume: Map<string, number> = new Map()
    const resolutionRateMap: Map<string, { total: number; resolved: number }> = new Map()

    tickets?.forEach((ticket) => {
      const date = new Date(ticket.created_at)
      let key: string

      switch (granularity) {
        case 'hourly':
          key = `${date.toISOString().split('T')[0]}T${date.getHours().toString().padStart(2, '0')}:00`
          break
        case 'daily':
          key = date.toISOString().split('T')[0]
          break
        case 'weekly':
          // Get start of week (Monday)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay() + 1)
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
          break
      }

      ticketVolume.set(key, (ticketVolume.get(key) || 0) + 1)

      const existing = resolutionRateMap.get(key) || { total: 0, resolved: 0 }
      existing.total++
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        existing.resolved++
      }
      resolutionRateMap.set(key, existing)
    })

    // Convert to array format
    const ticketVolumeData = Array.from(ticketVolume.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const resolutionRateData = Array.from(resolutionRateMap.entries())
      .map(([date, { total, resolved }]) => ({
        date,
        value: total > 0 ? Math.round((resolved / total) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // For now, return simplified trend data
    // TODO: Add avgResponseTime and satisfaction trends
    return {
      ticketVolume: ticketVolumeData,
      resolutionRate: resolutionRateData,
      avgResponseTime: [],
      satisfaction: [],
      granularity,
      period: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    }
  } catch (error) {
    logger.error('Error fetching ticket trends', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get category distribution and performance
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Category distribution data
 */
export async function getCategoryDistribution(
  userId: string,
  dateRange?: DateRange
): Promise<CategoryDistribution[]> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('category, created_at, resolved_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch category distribution: ${error.message}`)
    }

    // Group by category
    const categoryMap: Map<
      string,
      { count: number; resolutionTimes: number[] }
    > = new Map()
    const total = tickets?.length || 0

    tickets?.forEach((ticket) => {
      const category = ticket.category || 'Uncategorized'
      const existing = categoryMap.get(category) || { count: 0, resolutionTimes: [] }
      existing.count++

      if (ticket.resolved_at) {
        const created = new Date(ticket.created_at).getTime()
        const resolved = new Date(ticket.resolved_at).getTime()
        const hours = (resolved - created) / (1000 * 60 * 60)
        existing.resolutionTimes.push(hours)
      }

      categoryMap.set(category, existing)
    })

    // Convert to array
    return Array.from(categoryMap.entries())
      .map(([category, { count, resolutionTimes }]) => {
        const avgHours =
          resolutionTimes.length > 0
            ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
            : 0

        return {
          category,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          avgResolutionTime: formatDuration(avgHours),
          avgResolutionTimeHours: avgHours,
        }
      })
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    logger.error('Error fetching category distribution', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get priority distribution and performance
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Priority distribution data
 */
export async function getPriorityDistribution(
  userId: string,
  dateRange?: DateRange
): Promise<PriorityDistribution[]> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('priority, created_at, resolved_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch priority distribution: ${error.message}`)
    }

    // Group by priority
    const priorityMap: Map<
      'low' | 'medium' | 'high',
      { count: number; resolutionTimes: number[] }
    > = new Map([
      ['low', { count: 0, resolutionTimes: [] }],
      ['medium', { count: 0, resolutionTimes: [] }],
      ['high', { count: 0, resolutionTimes: [] }],
    ])

    const total = tickets?.length || 0

    tickets?.forEach((ticket) => {
      const priority = ticket.priority as 'low' | 'medium' | 'high'
      const existing = priorityMap.get(priority)!
      existing.count++

      if (ticket.resolved_at) {
        const created = new Date(ticket.created_at).getTime()
        const resolved = new Date(ticket.resolved_at).getTime()
        const hours = (resolved - created) / (1000 * 60 * 60)
        existing.resolutionTimes.push(hours)
      }
    })

    // Convert to array
    return Array.from(priorityMap.entries()).map(([priority, { count, resolutionTimes }]) => {
      const avgHours =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
          : 0

      return {
        priority,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        avgResolutionTime: formatDuration(avgHours),
        avgResolutionTimeHours: avgHours,
      }
    })
  } catch (error) {
    logger.error('Error fetching priority distribution', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get status distribution
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Status distribution data
 */
export async function getStatusDistribution(
  userId: string,
  dateRange?: DateRange
): Promise<StatusDistribution[]> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('status')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch status distribution: ${error.message}`)
    }

    // Group by status
    const statusMap: Map<
      'open' | 'in_progress' | 'resolved' | 'closed',
      number
    > = new Map([
      ['open', 0],
      ['in_progress', 0],
      ['resolved', 0],
      ['closed', 0],
    ])

    const total = tickets?.length || 0

    tickets?.forEach((ticket) => {
      const status = ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    // Convert to array
    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
  } catch (error) {
    logger.error('Error fetching status distribution', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get staff performance metrics
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Staff performance data
 */
export async function getStaffPerformanceMetrics(
  userId: string,
  dateRange?: DateRange
): Promise<StaffPerformance[]> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    // Get all staff users
    const { data: staffUsers, error: staffError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('role', ['staff', 'admin', 'super_admin'])

    if (staffError) {
      throw new Error(`Failed to fetch staff users: ${staffError.message}`)
    }

    // Get tickets assigned to staff
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, assigned_to, status, created_at, resolved_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())

    if (ticketsError) {
      throw new Error(`Failed to fetch tickets: ${ticketsError.message}`)
    }

    // Get ticket IDs for all tickets in range
    const ticketIds = tickets?.map((t) => t.id) || []

    // Fetch first staff comments for response time calculation
    let staffCommentsMap = new Map<string, Map<string, Date>>() // ticketId -> staffId -> first comment time
    if (ticketIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('ticket_comments')
        .select('ticket_id, created_at, user_id, users!inner(role)')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true })

      if (!commentsError && comments) {
        // Group by ticket, find first staff response for each ticket
        const ticketFirstStaffComment = new Map<string, { staffId: string; time: Date }>()

        for (const comment of comments) {
          if (ticketFirstStaffComment.has(comment.ticket_id)) continue

          const users = comment.users as unknown as { role: string } | { role: string }[]
          const role = Array.isArray(users) ? users[0]?.role : users?.role

          if (['staff', 'admin', 'super_admin'].includes(role || '')) {
            ticketFirstStaffComment.set(comment.ticket_id, {
              staffId: comment.user_id,
              time: new Date(comment.created_at)
            })
          }
        }

        // Convert to staff -> ticket -> time map
        staffCommentsMap = new Map()
        for (const [ticketId, { staffId, time }] of ticketFirstStaffComment) {
          if (!staffCommentsMap.has(staffId)) {
            staffCommentsMap.set(staffId, new Map())
          }
          staffCommentsMap.get(staffId)!.set(ticketId, time)
        }
      }
    }

    // Fetch satisfaction scores for tickets
    let ticketSatisfactionMap = new Map<string, number>() // ticketId -> rating
    if (ticketIds.length > 0) {
      const { data: feedback, error: feedbackError } = await supabase
        .from('ticket_feedback')
        .select('ticket_id, rating')
        .in('ticket_id', ticketIds)

      if (!feedbackError && feedback) {
        for (const f of feedback) {
          ticketSatisfactionMap.set(f.ticket_id, f.rating)
        }
      }
    }

    // Calculate metrics for each staff member
    const performanceData: StaffPerformance[] = []

    for (const staff of staffUsers || []) {
      const staffTickets = tickets?.filter((t) => t.assigned_to === staff.id) || []
      const resolvedTickets = staffTickets.filter(
        (t) => t.status === 'resolved' || t.status === 'closed'
      )

      // Calculate avg resolution time
      let avgResolutionTimeHours = 0
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          if (!ticket.resolved_at) return sum
          const created = new Date(ticket.created_at).getTime()
          const resolved = new Date(ticket.resolved_at).getTime()
          return sum + (resolved - created) / (1000 * 60 * 60)
        }, 0)
        avgResolutionTimeHours = totalTime / resolvedTickets.length
      }

      // Calculate first response time for this staff member
      let avgResponseTimeHours = 0
      const staffFirstResponses = staffCommentsMap.get(staff.id)
      if (staffFirstResponses && staffFirstResponses.size > 0) {
        const responseTimes: number[] = []

        for (const [ticketId, commentTime] of staffFirstResponses) {
          const ticket = tickets?.find((t) => t.id === ticketId)
          if (ticket) {
            const ticketCreated = new Date(ticket.created_at).getTime()
            const responseTime = (commentTime.getTime() - ticketCreated) / (1000 * 60 * 60)
            responseTimes.push(responseTime)
          }
        }

        if (responseTimes.length > 0) {
          avgResponseTimeHours = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        }
      }

      // Calculate satisfaction score for tickets assigned to this staff member
      let satisfactionScore = 0
      const staffTicketIds = staffTickets.map((t) => t.id)
      const staffRatings = staffTicketIds
        .map((id) => ticketSatisfactionMap.get(id))
        .filter((rating): rating is number => rating !== undefined)

      if (staffRatings.length > 0) {
        satisfactionScore = Math.round(
          (staffRatings.reduce((sum, r) => sum + r, 0) / staffRatings.length) * 10
        ) / 10
      }

      // Calculate overdue tickets
      const now = new Date().getTime()
      const overdueTickets = staffTickets.filter((ticket) => {
        if (ticket.status === 'resolved' || ticket.status === 'closed') return false
        const created = new Date(ticket.created_at).getTime()
        const ageInHours = (now - created) / (1000 * 60 * 60)
        const threshold = 24 // Default threshold
        return ageInHours > threshold
      }).length

      performanceData.push({
        userId: staff.id,
        userName: staff.full_name || 'Unknown',
        email: staff.email,
        ticketsResolved: resolvedTickets.length,
        ticketsAssigned: staffTickets.length,
        avgResolutionTime: formatDuration(avgResolutionTimeHours),
        avgResolutionTimeHours,
        avgResponseTime: avgResponseTimeHours > 0 ? formatDuration(avgResponseTimeHours) : '-',
        avgResponseTimeHours,
        satisfactionScore,
        activeTickets: staffTickets.filter((t) =>
          ['open', 'in_progress'].includes(t.status)
        ).length,
        overdueTickets,
      })
    }

    return performanceData.sort((a, b) => b.ticketsResolved - a.ticketsResolved)
  } catch (error) {
    logger.error('Error fetching staff performance', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get peak hours and days analysis
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Peak hours data
 */
export async function getPeakHoursAnalysis(
  userId: string,
  dateRange?: DateRange
): Promise<PeakHoursData> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('created_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`)
    }

    // Initialize hourly and daily counters
    const hourlyMap = new Map<number, number>()
    const dailyMap = new Map<number, number>()

    for (let i = 0; i < 24; i++) hourlyMap.set(i, 0)
    for (let i = 0; i < 7; i++) dailyMap.set(i, 0)

    // Count tickets by hour and day
    tickets?.forEach((ticket) => {
      const date = new Date(ticket.created_at)
      const hour = date.getHours()
      const day = date.getDay()

      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    })

    // Format hourly data
    const hourLabels = [
      '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
      '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
      '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
      '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',
    ]

    const hourly = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({
        hour,
        count,
        label: hourLabels[hour],
      }))
      .sort((a, b) => a.hour - b.hour)

    // Format daily data
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    const daily = Array.from(dailyMap.entries())
      .map(([day, count]) => ({
        day,
        count,
        label: dayLabels[day],
      }))
      .sort((a, b) => a.day - b.day)

    return {
      hourly,
      daily,
    }
  } catch (error) {
    logger.error('Error fetching peak hours', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get SLA compliance metrics
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns SLA compliance data
 */
export async function getSLACompliance(
  userId: string,
  dateRange?: DateRange
): Promise<SLACompliance> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('priority, created_at, resolved_at')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())
      .not('resolved_at', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch SLA data: ${error.message}`)
    }

    let withinSLA = 0
    let breachedSLA = 0
    const breachTimes: number[] = []
    const byPriority = { low: 0, medium: 0, high: 0 }
    const totalByPriority = { low: 0, medium: 0, high: 0 }

    tickets?.forEach((ticket) => {
      if (!ticket.resolved_at) return

      const priority = ticket.priority as 'low' | 'medium' | 'high'
      const created = new Date(ticket.created_at).getTime()
      const resolved = new Date(ticket.resolved_at).getTime()
      const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60)
      const threshold = SLA_THRESHOLDS[priority]

      totalByPriority[priority]++

      if (resolutionTimeHours <= threshold) {
        withinSLA++
        byPriority[priority]++
      } else {
        breachedSLA++
        breachTimes.push(resolutionTimeHours - threshold)
      }
    })

    const total = withinSLA + breachedSLA
    const overall = total > 0 ? Math.round((withinSLA / total) * 100) : 0

    const avgBreachTimeHours =
      breachTimes.length > 0
        ? breachTimes.reduce((sum, t) => sum + t, 0) / breachTimes.length
        : 0

    return {
      overall,
      byPriority: {
        low: totalByPriority.low > 0 ? Math.round((byPriority.low / totalByPriority.low) * 100) : 0,
        medium:
          totalByPriority.medium > 0
            ? Math.round((byPriority.medium / totalByPriority.medium) * 100)
            : 0,
        high:
          totalByPriority.high > 0 ? Math.round((byPriority.high / totalByPriority.high) * 100) : 0,
      },
      withinSLA,
      breachedSLA,
      averageBreachTime: formatDuration(avgBreachTimeHours),
      averageBreachTimeHours: avgBreachTimeHours,
    }
  } catch (error) {
    logger.error('Error fetching SLA compliance', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get satisfaction breakdown with ratings distribution
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns Satisfaction breakdown
 */
export async function getSatisfactionBreakdown(
  userId: string,
  dateRange?: DateRange
): Promise<SatisfactionBreakdown> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    const { data: feedback, error } = await supabase
      .from('ticket_feedback')
      .select('id, rating, comment, ticket_id, created_at, tickets!inner(created_at, category)')
      .gte('tickets.created_at', range.start.toISOString())
      .lte('tickets.created_at', range.end.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch satisfaction data: ${error.message}`)
    }

    // Calculate overall score
    const totalResponses = feedback?.length || 0
    const overallScore =
      totalResponses > 0
        ? Math.round(
            (feedback!.reduce((sum, f) => sum + f.rating, 0) / totalResponses) * 10
          ) / 10
        : 0

    // Calculate distribution
    const ratingCounts = new Map<number, number>()
    for (let i = 1; i <= 5; i++) ratingCounts.set(i, 0)

    feedback?.forEach((f) => {
      ratingCounts.set(f.rating, (ratingCounts.get(f.rating) || 0) + 1)
    })

    const distribution = Array.from(ratingCounts.entries()).map(([rating, count]) => ({
      rating,
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
    }))

    // Calculate by category
    const categoryMap = new Map<string, { total: number; sum: number }>()

    feedback?.forEach((f) => {
      const ticketData = f.tickets as unknown as { category: string }
      const category = Array.isArray(ticketData)
        ? ticketData[0]?.category || 'Uncategorized'
        : ticketData?.category || 'Uncategorized'

      const existing = categoryMap.get(category) || { total: 0, sum: 0 }
      existing.total++
      existing.sum += f.rating
      categoryMap.set(category, existing)
    })

    const byCategory = Array.from(categoryMap.entries()).map(([category, { total, sum }]) => ({
      category,
      score: Math.round((sum / total) * 10) / 10,
      responses: total,
    }))

    // Recent feedback (last 5)
    const recentFeedback = (feedback || []).slice(0, 5).map((f) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      ticketId: f.ticket_id,
      createdAt: f.created_at,
    }))

    return {
      overallScore,
      totalResponses,
      distribution,
      byCategory,
      recentFeedback,
    }
  } catch (error) {
    logger.error('Error fetching satisfaction breakdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get complete analytics report
 *
 * @param userId - User ID making the request
 * @param filters - Optional analytics filters
 * @returns Complete analytics report
 */
export async function getAnalyticsReport(
  userId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsReport> {
  try {
    const [
      summary,
      categoryDistribution,
      priorityDistribution,
      statusDistribution,
      staffPerformance,
      satisfactionBreakdown,
      slaCompliance,
      peakHours,
    ] = await Promise.all([
      getAnalyticsSummary(userId, filters?.dateRange),
      getCategoryDistribution(userId, filters?.dateRange),
      getPriorityDistribution(userId, filters?.dateRange),
      getStatusDistribution(userId, filters?.dateRange),
      getStaffPerformanceMetrics(userId, filters?.dateRange),
      getSatisfactionBreakdown(userId, filters?.dateRange),
      getSLACompliance(userId, filters?.dateRange),
      getPeakHoursAnalysis(userId, filters?.dateRange),
    ])

    return {
      summary,
      categoryDistribution,
      priorityDistribution,
      statusDistribution,
      staffPerformance,
      satisfactionBreakdown,
      slaCompliance,
      peakHours,
    }
  } catch (error) {
    logger.error('Error generating analytics report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}

/**
 * Get AI chat analytics
 *
 * @param userId - User ID making the request
 * @param dateRange - Optional date range filter
 * @returns AI analytics data
 */
export async function getAIAnalytics(
  userId: string,
  dateRange?: DateRange
): Promise<AIAnalyticsData> {
  const supabase = await createClient()

  // Verify admin access
  const isAdmin = await verifyAdminRole(userId)
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const range = dateRange || getDefaultDateRange()

  try {
    // Fetch all AI interactions
    const { data: interactions, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch AI interactions: ${error.message}`)
    }

    const allInteractions = interactions || []

    // Calculate summary metrics
    const totalQueries = allInteractions.length
    const uniqueSessions = new Set(allInteractions.map((i) => i.session_id)).size
    const uniqueUsers = new Set(allInteractions.filter((i) => i.user_id).map((i) => i.user_id)).size
    const escalatedCount = allInteractions.filter((i) => i.escalated_to_ticket).length
    const escalationRate = totalQueries > 0 ? Math.round((escalatedCount / totalQueries) * 100) : 0

    // Calculate response time
    const responseTimes = allInteractions
      .filter((i) => i.response_time_ms)
      .map((i) => i.response_time_ms!)
    const avgResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
        : 0

    // Calculate helpfulness
    const withFeedback = allInteractions.filter((i) => i.was_helpful !== null)
    const helpfulCount = withFeedback.filter((i) => i.was_helpful === true).length
    const notHelpfulCount = withFeedback.filter((i) => i.was_helpful === false).length
    const helpfulnessRate =
      withFeedback.length > 0 ? Math.round((helpfulCount / withFeedback.length) * 100) : 0

    const summary: AIAnalyticsSummary = {
      totalConversations: uniqueSessions,
      totalQueries,
      escalationRate,
      avgResponseTime: avgResponseTimeMs < 1000 ? `${avgResponseTimeMs}ms` : `${(avgResponseTimeMs / 1000).toFixed(1)}s`,
      avgResponseTimeMs,
      helpfulnessRate,
      helpfulCount,
      notHelpfulCount,
      uniqueUsers,
      period: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    }

    // Calculate volume trend (daily)
    const volumeMap = new Map<string, { conversations: Set<string>; queries: number; escalations: number }>()

    allInteractions.forEach((interaction) => {
      const date = new Date(interaction.created_at).toISOString().split('T')[0]
      const existing = volumeMap.get(date) || {
        conversations: new Set<string>(),
        queries: 0,
        escalations: 0,
      }
      existing.conversations.add(interaction.session_id)
      existing.queries++
      if (interaction.escalated_to_ticket) existing.escalations++
      volumeMap.set(date, existing)
    })

    const volumeTrend: AIVolumeTrend[] = Array.from(volumeMap.entries())
      .map(([date, data]) => ({
        date,
        conversations: data.conversations.size,
        queries: data.queries,
        escalations: data.escalations,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Extract common queries (simplified - just count similar queries)
    const queryMap = new Map<string, { count: number; responseTimes: number[]; helpful: number; total: number }>()

    allInteractions.forEach((interaction) => {
      // Normalize query (lowercase, first 100 chars)
      const normalizedQuery = interaction.query.toLowerCase().trim().substring(0, 100)
      const existing = queryMap.get(normalizedQuery) || {
        count: 0,
        responseTimes: [],
        helpful: 0,
        total: 0,
      }
      existing.count++
      if (interaction.response_time_ms) existing.responseTimes.push(interaction.response_time_ms)
      if (interaction.was_helpful !== null) {
        existing.total++
        if (interaction.was_helpful) existing.helpful++
      }
      queryMap.set(normalizedQuery, existing)
    })

    const commonQueries: CommonQuery[] = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query: query.length > 80 ? query.substring(0, 80) + '...' : query,
        count: data.count,
        avgResponseTime:
          data.responseTimes.length > 0
            ? Math.round(data.responseTimes.reduce((sum, t) => sum + t, 0) / data.responseTimes.length)
            : 0,
        helpfulnessRate: data.total > 0 ? Math.round((data.helpful / data.total) * 100) : 0,
      }))
      .filter((q) => q.count > 1) // Only show queries asked more than once
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10

    // Helpfulness distribution
    const noFeedback = allInteractions.filter((i) => i.was_helpful === null).length
    const helpfulnessDistribution = {
      helpful: helpfulCount,
      notHelpful: notHelpfulCount,
      noFeedback,
    }

    // For escalations by category, we'd need to join with tickets
    // For now, return empty array
    const escalationsByCategory: { category: string; count: number; percentage: number }[] = []

    return {
      summary,
      volumeTrend,
      commonQueries,
      helpfulnessDistribution,
      escalationsByCategory,
    }
  } catch (error) {
    logger.error('Error fetching AI analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
    throw error
  }
}
