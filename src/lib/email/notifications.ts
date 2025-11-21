/**
 * Email Notification Helpers
 *
 * Functions to send email notifications for various events
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { sendTicketNotification, sendWelcomeEmail } from './service'
import { logger } from '@/lib/logger'
import { clientEnv } from '@/lib/env/client'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Notify user about ticket assignment
 */
export async function notifyTicketAssignment(
  ticketId: string,
  assignedToUserId: string,
  assignedByUserName: string
) {
  try {
    const supabase = await createClient()

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      logger.error('Failed to fetch ticket for email notification', {
        ticketId,
        error: ticketError?.message,
      })
      return
    }

    // Get assigned user details
    const { data: assignedUser, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', assignedToUserId)
      .single()

    if (userError || !assignedUser) {
      logger.error('Failed to fetch assigned user for email notification', {
        userId: assignedToUserId,
        error: userError?.message,
      })
      return
    }

    // Send email
    const siteUrl = clientEnv.app.siteUrl || 'http://localhost:3000'
    await sendTicketNotification({
      to: assignedUser.email,
      recipientName: assignedUser.full_name || 'User',
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      action: 'assigned',
      actionBy: assignedByUserName,
      ticketUrl: `${siteUrl}/tickets/${ticketId}`,
    })

    logger.info('Ticket assignment email sent', {
      ticketId,
      assignedTo: assignedUser.email,
    })
  } catch (error) {
    logger.error('Error sending ticket assignment email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId,
    })
    // Don't throw - email failures shouldn't block ticket operations
  }
}

/**
 * Notify ticket owner about status change
 */
export async function notifyTicketStatusChange(
  ticketId: string,
  newStatus: string,
  changedByUserName: string,
  message?: string
) {
  try {
    const supabase = await createClient()

    // Get ticket details including owner
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title, user_id')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      logger.error('Failed to fetch ticket for status change email', {
        ticketId,
        error: ticketError?.message,
      })
      return
    }

    // Get ticket owner details
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', ticket.user_id)
      .single()

    if (ownerError || !owner) {
      logger.error('Failed to fetch ticket owner for email', {
        userId: ticket.user_id,
        error: ownerError?.message,
      })
      return
    }

    // Map status to action
    const statusActionMap: Record<string, 'updated' | 'resolved' | 'closed'> = {
      resolved: 'resolved',
      closed: 'closed',
    }
    const action = statusActionMap[newStatus] || 'updated'

    // Send email
    const siteUrl = clientEnv.app.siteUrl || 'http://localhost:3000'
    await sendTicketNotification({
      to: owner.email,
      recipientName: owner.full_name || 'User',
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      action,
      actionBy: changedByUserName,
      message,
      ticketUrl: `${siteUrl}/tickets/${ticketId}`,
    })

    logger.info('Ticket status change email sent', {
      ticketId,
      newStatus,
      sentTo: owner.email,
    })
  } catch (error) {
    logger.error('Error sending ticket status change email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId,
    })
  }
}

/**
 * Notify about new comment on ticket
 */
export async function notifyTicketComment(
  ticketId: string,
  commentAuthorName: string,
  commentText: string
) {
  try {
    const supabase = await createClient()

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title, user_id, assigned_to')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      logger.error('Failed to fetch ticket for comment email', {
        ticketId,
        error: ticketError?.message,
      })
      return
    }

    // Get all users to notify (owner + assigned staff)
    const userIds = [ticket.user_id, ticket.assigned_to].filter(Boolean) as string[]
    const uniqueUserIds = [...new Set(userIds)]

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, full_name')
      .in('id', uniqueUserIds)

    if (usersError || !users) {
      logger.error('Failed to fetch users for comment email', {
        error: usersError?.message,
      })
      return
    }

    // Send email to each user
    const siteUrl = clientEnv.app.siteUrl || 'http://localhost:3000'
    const emailPromises = users.map((user) =>
      sendTicketNotification({
        to: user.email,
        recipientName: user.full_name || 'User',
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        action: 'commented',
        actionBy: commentAuthorName,
        message: commentText.substring(0, 200), // First 200 chars
        ticketUrl: `${siteUrl}/tickets/${ticketId}`,
      })
    )

    await Promise.all(emailPromises)

    logger.info('Ticket comment emails sent', {
      ticketId,
      recipientCount: users.length,
    })
  } catch (error) {
    logger.error('Error sending ticket comment emails', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId,
    })
  }
}

/**
 * Send welcome email to new user
 */
export async function notifyNewUser(userId: string) {
  try {
    const supabase = await createClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('Failed to fetch user for welcome email', {
        userId,
        error: userError?.message,
      })
      return
    }

    // Send welcome email
    const siteUrl = clientEnv.app.siteUrl || 'http://localhost:3000'
    await sendWelcomeEmail({
      to: user.email,
      userName: user.full_name || 'User',
      userEmail: user.email,
      role: user.role,
      dashboardUrl: `${siteUrl}/dashboard`,
    })

    logger.info('Welcome email sent', {
      userId,
      email: user.email,
    })
  } catch (error) {
    logger.error('Error sending welcome email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })
  }
}
