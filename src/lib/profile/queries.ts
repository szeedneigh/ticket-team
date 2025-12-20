/**
 * Profile Activity Queries
 *
 * Server-side data fetching functions for user activity and statistics
 */

import { createClient } from '@/lib/supabase/server'
import type { User as _User } from '@/lib/types'

// ============================================================================
// Activity Timeline Types
// ============================================================================

export interface ActivityTimelineItem {
  id: string
  type: 'ticket_created' | 'ticket_updated' | 'comment_added' | 'kb_article_created' | 'kb_article_updated' | 'activity'
  title: string
  description?: string
  timestamp: string
  metadata?: Record<string, unknown>
  icon?: string
}

export interface DetailedStats {
  ticketsByCategory: Array<{ category: string; count: number }>
  ticketsByPriority: Array<{ priority: string; count: number }>
  ticketsByStatus: Array<{ status: string; count: number }>
  totalTickets: number
  totalComments: number
  totalKBArticles: number
  avgResolutionTimeHours: number | null
}

export interface RecentTicket {
  id: string
  title: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
}

export interface RecentComment {
  id: string
  ticket_id: string
  content: string
  created_at: string
  ticket_title: string
}

export interface RecentKBArticle {
  id: string
  title: string
  status: string
  category: string
  view_count: number
  created_at: string
  updated_at: string
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get user activity timeline with pagination
 */
export async function getUserActivityTimeline(
  userId: string,
  options: {
    limit?: number
    offset?: number
    dateFrom?: Date
    dateTo?: Date
    activityTypes?: string[]
  } = {}
): Promise<ActivityTimelineItem[]> {
  const supabase = await createClient()
  const { limit = 20, offset = 0, dateFrom, dateTo, activityTypes } = options

  const activities: ActivityTimelineItem[] = []

  // Build date filter (unused but kept for future use)
  const _dateFilter = ''
  if (dateFrom || dateTo) {
    // We'll apply date filtering in memory for simplicity
  }

  // Fetch ticket activities
  if (!activityTypes || activityTypes.includes('ticket_created') || activityTypes.includes('ticket_updated')) {
    const ticketQuery = supabase
      .from('ticket_activities')
      .select('id, action, ticket_id, created_at, old_value, new_value, metadata, tickets!inner(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: ticketActivities } = await ticketQuery

    if (ticketActivities) {
      ticketActivities.forEach((activity) => {
        const ticket = activity.tickets as unknown as { title: string }
        activities.push({
          id: `activity-${activity.id}`,
          type: 'activity',
          title: formatActivityAction(activity.action),
          description: ticket?.title || 'Ticket',
          timestamp: activity.created_at,
          metadata: {
            action: activity.action,
            old_value: activity.old_value,
            new_value: activity.new_value,
            ticket_id: activity.ticket_id,
            ...activity.metadata,
          },
        })
      })
    }
  }

  // Fetch tickets created
  if (!activityTypes || activityTypes.includes('ticket_created')) {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, title, status, priority, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (tickets) {
      tickets.forEach((ticket) => {
        activities.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket_created',
          title: 'Created ticket',
          description: ticket.title,
          timestamp: ticket.created_at,
          metadata: { ticket_id: ticket.id, status: ticket.status, priority: ticket.priority },
        })
      })
    }
  }

  // Fetch comments
  if (!activityTypes || activityTypes.includes('comment_added')) {
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('id, ticket_id, content, created_at, tickets!inner(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (comments) {
      comments.forEach((comment) => {
        const ticket = comment.tickets as unknown as { title: string }
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment_added',
          title: 'Posted comment',
          description: ticket?.title || 'on ticket',
          timestamp: comment.created_at,
          metadata: {
            ticket_id: comment.ticket_id,
            content: comment.content.substring(0, 100),
          },
        })
      })
    }
  }

  // Fetch KB articles (for staff)
  if (!activityTypes || activityTypes.includes('kb_article_created')) {
    const { data: articles } = await supabase
      .from('knowledge_articles')
      .select('id, title, status, created_at, updated_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (articles) {
      articles.forEach((article) => {
        activities.push({
          id: `kb-${article.id}`,
          type: 'kb_article_created',
          title: 'Created KB article',
          description: article.title,
          timestamp: article.created_at,
          metadata: { article_id: article.id, status: article.status },
        })
      })
    }
  }

  // Sort all activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Apply date filters
  let filteredActivities = activities
  if (dateFrom) {
    filteredActivities = filteredActivities.filter(
      (a) => new Date(a.timestamp) >= dateFrom
    )
  }
  if (dateTo) {
    filteredActivities = filteredActivities.filter(
      (a) => new Date(a.timestamp) <= dateTo
    )
  }

  // Apply pagination
  return filteredActivities.slice(offset, offset + limit)
}

/**
 * Get detailed user statistics
 */
export async function getDetailedStats(userId: string): Promise<DetailedStats> {
  const supabase = await createClient()

  // Get tickets by category
  const { data: ticketsByCategory } = await supabase
    .from('tickets')
    .select('category')
    .eq('user_id', userId)

  const categoryMap = new Map<string, number>()
  ticketsByCategory?.forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1)
  })

  // Get tickets by priority
  const { data: ticketsByPriority } = await supabase
    .from('tickets')
    .select('priority')
    .eq('user_id', userId)

  const priorityMap = new Map<string, number>()
  ticketsByPriority?.forEach((t) => {
    priorityMap.set(t.priority, (priorityMap.get(t.priority) || 0) + 1)
  })

  // Get tickets by status
  const { data: ticketsByStatus } = await supabase
    .from('tickets')
    .select('status')
    .eq('user_id', userId)

  const statusMap = new Map<string, number>()
  ticketsByStatus?.forEach((t) => {
    statusMap.set(t.status, (statusMap.get(t.status) || 0) + 1)
  })

  // Get total counts
  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: totalComments } = await supabase
    .from('ticket_comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: totalKBArticles } = await supabase
    .from('knowledge_articles')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)

  // Calculate average resolution time (for staff/admin only)
  const { data: resolvedTickets } = await supabase
    .from('tickets')
    .select('created_at, resolved_at')
    .eq('user_id', userId)
    .not('resolved_at', 'is', null)

  let avgResolutionTimeHours = null
  if (resolvedTickets && resolvedTickets.length > 0) {
    const totalHours = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at)
      const resolved = new Date(ticket.resolved_at!)
      const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
      return sum + hours
    }, 0)
    avgResolutionTimeHours = totalHours / resolvedTickets.length
  }

  return {
    ticketsByCategory: Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    ticketsByPriority: Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count,
    })),
    ticketsByStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    totalTickets: totalTickets || 0,
    totalComments: totalComments || 0,
    totalKBArticles: totalKBArticles || 0,
    avgResolutionTimeHours,
  }
}

/**
 * Get recent tickets for a user
 */
export async function getRecentTickets(
  userId: string,
  limit: number = 5
): Promise<RecentTicket[]> {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, status, priority, category, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  return tickets || []
}

/**
 * Get recent comments for a user
 */
export async function getRecentComments(
  userId: string,
  limit: number = 5
): Promise<RecentComment[]> {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('ticket_comments')
    .select('id, ticket_id, content, created_at, tickets!inner(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!comments) return []

  return comments.map((comment) => {
    const ticket = comment.tickets as unknown as { title: string }
    return {
      id: comment.id,
      ticket_id: comment.ticket_id,
      content: comment.content,
      created_at: comment.created_at,
      ticket_title: ticket?.title || 'Unknown Ticket',
    }
  })
}

/**
 * Get recent KB articles for a user (staff only)
 */
export async function getRecentKBArticles(
  userId: string,
  limit: number = 5
): Promise<RecentKBArticle[]> {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('knowledge_articles')
    .select('id, title, status, category, view_count, created_at, updated_at')
    .eq('author_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  return articles || []
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    ticket_created: 'Created ticket',
    ticket_updated: 'Updated ticket',
    status_changed: 'Changed status',
    priority_changed: 'Changed priority',
    ticket_assigned: 'Assigned ticket',
    comment_added: 'Added comment',
    attachment_added: 'Added attachment',
    resolution_added: 'Added resolution',
  }

  return actionMap[action] || action.replace(/_/g, ' ')
}
