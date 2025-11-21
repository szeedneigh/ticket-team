/**
 * Email Service
 *
 * Handles sending emails using Resend
 */

import { Resend } from 'resend'
import { render } from '@react-email/render'
import { serverEnv } from '@/lib/env/server'
import { logger } from '@/lib/logger'
import TicketNotificationEmail from '@/emails/ticket-notification'
import WelcomeEmail from '@/emails/welcome'

// ============================================================================
// Initialize Resend
// ============================================================================

const resend = new Resend(serverEnv.resend.apiKey)

// ============================================================================
// Types
// ============================================================================

export interface TicketNotificationData {
  to: string
  recipientName: string
  ticketId: string
  ticketTitle: string
  action: 'created' | 'updated' | 'assigned' | 'commented' | 'resolved' | 'closed'
  actionBy: string
  message?: string
  ticketUrl: string
}

export interface WelcomeEmailData {
  to: string
  userName: string
  userEmail: string
  role: string
  dashboardUrl: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================================================
// Send Functions
// ============================================================================

/**
 * Send ticket notification email
 */
export async function sendTicketNotification(
  data: TicketNotificationData
): Promise<EmailResult> {
  try {
    const emailHtml = await render(
      TicketNotificationEmail({
        recipientName: data.recipientName,
        ticketId: data.ticketId,
        ticketTitle: data.ticketTitle,
        action: data.action,
        actionBy: data.actionBy,
        message: data.message,
        ticketUrl: data.ticketUrl,
      })
    )

    const actionText = {
      created: 'New Ticket Created',
      updated: 'Ticket Updated',
      assigned: 'Ticket Assigned to You',
      commented: 'New Comment on Ticket',
      resolved: 'Ticket Resolved',
      closed: 'Ticket Closed',
    }

    const result = await resend.emails.send({
      from: 'Ticket Team <noreply@ticketteam.laverdad.edu.ph>',
      to: data.to,
      subject: `${actionText[data.action]}: ${data.ticketId}`,
      html: emailHtml,
    })

    if (result.error) {
      logger.error('Failed to send ticket notification email', {
        error: result.error,
        to: data.to,
        ticketId: data.ticketId,
      })
      return {
        success: false,
        error: result.error.message,
      }
    }

    logger.info('Ticket notification email sent', {
      messageId: result.data?.id,
      to: data.to,
      ticketId: data.ticketId,
      action: data.action,
    })

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    logger.error('Error sending ticket notification email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: data.to,
      ticketId: data.ticketId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    const emailHtml = await render(
      WelcomeEmail({
        userName: data.userName,
        userEmail: data.userEmail,
        role: data.role,
        dashboardUrl: data.dashboardUrl,
      })
    )

    const result = await resend.emails.send({
      from: 'Ticket Team <noreply@ticketteam.laverdad.edu.ph>',
      to: data.to,
      subject: 'Welcome to Ticket Team! 🎉',
      html: emailHtml,
    })

    if (result.error) {
      logger.error('Failed to send welcome email', {
        error: result.error,
        to: data.to,
      })
      return {
        success: false,
        error: result.error.message,
      }
    }

    logger.info('Welcome email sent', {
      messageId: result.data?.id,
      to: data.to,
    })

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    logger.error('Error sending welcome email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: data.to,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send digest email with multiple notifications
 */
export async function sendDigestEmail(
  to: string,
  userName: string,
  notifications: Array<{
    ticketId: string
    ticketTitle: string
    action: string
    timestamp: Date
  }>
): Promise<EmailResult> {
  try {
    // Simple text-based digest for now
    const notificationList = notifications
      .map(
        (n) =>
          `- ${n.action} on ${n.ticketId}: ${n.ticketTitle} (${n.timestamp.toLocaleString()})`
      )
      .join('\n')

    const html = `
      <h2>Hi ${userName},</h2>
      <p>Here's your daily digest of ticket updates:</p>
      <pre>${notificationList}</pre>
      <p>Visit your dashboard to see more details.</p>
    `

    const result = await resend.emails.send({
      from: 'Ticket Team <noreply@ticketteam.laverdad.edu.ph>',
      to,
      subject: `Ticket Team Daily Digest - ${notifications.length} Updates`,
      html,
    })

    if (result.error) {
      logger.error('Failed to send digest email', {
        error: result.error,
        to,
      })
      return {
        success: false,
        error: result.error.message,
      }
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    logger.error('Error sending digest email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
