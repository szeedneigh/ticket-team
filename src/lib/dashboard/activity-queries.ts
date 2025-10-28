/**
 * Dashboard Activity Queries
 * 
 * Functions for fetching user activity data from the database.
 * Aggregates activities from tickets, comments, and status changes.
 * 
 * @module lib/dashboard/activity-queries
 */

import { createClient } from '@/lib/supabase/server'

export interface DashboardActivityItem {
  id: string
  type: 'ticket_created' | 'comment_added' | 'status_changed'
  title: string
  description?: string
  ticketId: string
  actorId: string
  createdAt: string
  meta?: Record<string, unknown>
}

interface ActivityQueryOptions {
  limit?: number
}

// Type for nested ticket relation in queries
interface TicketRelation {
  id: string
  title: string
}

/**
 * Get recent activity for a user
 * Aggregates tickets created, comments added, and status changes
 * 
 * @param userId - User ID to fetch activity for
 * @param options - Query options (limit)
 * @returns Array of activity items sorted by timestamp descending
 */
export async function getUserActivity(
  userId: string,
  options: ActivityQueryOptions = {}
): Promise<DashboardActivityItem[]> {
  const { limit = 20 } = options
  const supabase = await createClient()
  
  try {
    const activities: DashboardActivityItem[] = []
    
    // Fetch recent tickets created by user
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, created_at, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
    } else if (tickets) {
      tickets.forEach(ticket => {
        activities.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket_created',
          title: `Ticket #${ticket.id.slice(0, 8)}`,
          description: `Created ticket: ${ticket.title}`,
          ticketId: ticket.id,
          actorId: ticket.user_id,
          createdAt: ticket.created_at,
        })
      })
    }
    
    // Fetch recent comments by user
    const { data: comments, error: commentsError } = await supabase
      .from('ticket_comments')
      .select(`
        id,
        ticket_id,
        user_id,
        content,
        created_at,
        tickets!inner(id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    } else if (comments) {
      comments.forEach(comment => {
        // Supabase returns the relation as an object (not array) when using !inner
        const ticket = comment.tickets as unknown as TicketRelation
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment_added',
          title: `Ticket #${comment.ticket_id.slice(0, 8)}`,
          description: `Added comment on: ${ticket?.title || 'Unknown ticket'}`,
          ticketId: comment.ticket_id,
          actorId: comment.user_id,
          createdAt: comment.created_at,
          meta: {
            commentPreview: comment.content.slice(0, 100),
          },
        })
      })
    }
    
    // Fetch recent ticket activities (status changes) by user
    const { data: statusChanges, error: activitiesError } = await supabase
      .from('ticket_activities')
      .select(`
        id,
        ticket_id,
        user_id,
        action,
        old_value,
        new_value,
        created_at,
        metadata,
        tickets!inner(id, title)
      `)
      .eq('user_id', userId)
      .eq('action', 'status_changed')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
    } else if (statusChanges) {
      statusChanges.forEach(activity => {
        // Supabase returns the relation as an object (not array) when using !inner
        const ticket = activity.tickets as unknown as TicketRelation
        // Construct description from old_value and new_value
        const description = activity.old_value && activity.new_value
          ? `Status changed from ${activity.old_value} to ${activity.new_value}`
          : `Status changed on: ${ticket?.title || 'Unknown ticket'}`
        
        activities.push({
          id: `activity-${activity.id}`,
          type: 'status_changed',
          title: `Ticket #${activity.ticket_id.slice(0, 8)}`,
          description,
          ticketId: activity.ticket_id,
          actorId: activity.user_id,
          createdAt: activity.created_at,
          meta: activity.metadata || undefined,
        })
      })
    }
    
    // Sort all activities by timestamp descending and limit
    activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    return activities.slice(0, limit)
    
  } catch (error) {
    console.error('Error fetching user activity:', error)
    throw new Error('Failed to fetch user activity')
  }
}
