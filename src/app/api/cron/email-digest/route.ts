/**
 * Email Digest Cron Job
 *
 * POST /api/cron/email-digest
 *
 * Scheduled job to send daily digest emails to users who have
 * unread notifications. Runs daily at 9 AM UTC.
 *
 * Protected by Vercel Cron secret header.
 *
 * @module app/api/cron/email-digest/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendDigestEmail } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import { serverEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Verify the request is from Vercel Cron
 */
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

/**
 * Get users with digest preferences and unread notifications
 */
async function getUsersForDigest() {
  const supabase = createServiceClient()

  // Get users with daily digest preferences
  const { data: prefs, error: prefsError } = await supabase
    .from('user_notification_preferences')
    .select('user_id, email_enabled')
    .eq('digest_frequency', 'daily')
    .eq('email_enabled', true)
    .limit(1000)

  if (prefsError || !prefs) {
    logger.error('Error fetching users for digest', { error: prefsError?.message })
    return []
  }

  const userIds = prefs.map((p) => p.user_id)
  if (userIds.length === 0) {
    return []
  }

  // Get unread notifications for these users from last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, message, ticket_id, created_at, read_at')
    .in('user_id', userIds)
    .is('read_at', null)
    .gte('created_at', yesterday)
    .limit(5000) // Limit to prevent timeout

  if (notifError) {
    logger.error('Error fetching notifications for digest', { error: notifError.message })
    return []
  }

  // Get user details
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', userIds)

  if (usersError || !users) {
    logger.error('Error fetching user details', { error: usersError?.message })
    return []
  }

  // Group notifications by user
  const userMap = new Map<
    string,
    {
      userId: string
      email: string
      userName: string
      notifications: Array<{
        ticketId: string
        title: string
        action: string
        timestamp: Date
      }>
    }
  >()

  // Initialize user map
  users.forEach((user) => {
    userMap.set(user.id, {
      userId: user.id,
      email: user.email,
      userName: user.full_name || user.email.split('@')[0],
      notifications: [],
    })
  })

  // Add notifications to users
  notifications?.forEach((notif) => {
    const userData = userMap.get(notif.user_id)
    if (userData) {
      userData.notifications.push({
        ticketId: notif.ticket_id || 'N/A',
        title: notif.title || 'Notification',
        action: notif.type || 'update',
        timestamp: new Date(notif.created_at),
      })
    }
  })

  // Return only users with notifications
  return Array.from(userMap.values()).filter((u) => u.notifications.length > 0)
}

export async function GET(request: NextRequest) {
  // Verify this is a cron request
  if (!verifyCronRequest(request)) {
    logger.warn('Unauthorized cron request attempt', {
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if email is configured
  if (!serverEnv.resend.apiKey) {
    logger.warn('Email digest cron skipped: RESEND_API_KEY not configured')
    return NextResponse.json({
      success: false,
      message: 'Email service not configured',
      sent: 0,
    })
  }

  try {
    const users = await getUsersForDigest()
    let sentCount = 0
    let errorCount = 0

    // Send digest emails
    for (const user of users) {
      if (user.notifications.length === 0) {
        continue
      }

      try {
        const result = await sendDigestEmail(
          user.email,
          user.userName,
          user.notifications.map((n) => ({
            ticketId: n.ticketId,
            ticketTitle: n.title,
            action: n.action,
            timestamp: n.timestamp,
          }))
        )

        if (result.success) {
          sentCount++
          logger.info('Digest email sent', {
            userId: user.userId,
            email: user.email,
            notificationCount: user.notifications.length,
          })
        } else {
          errorCount++
          logger.error('Failed to send digest email', {
            userId: user.userId,
            email: user.email,
            error: result.error,
          })
        }
      } catch (error) {
        errorCount++
        logger.error('Error sending digest email', {
          userId: user.userId,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Digest emails processed',
      sent: sentCount,
      errors: errorCount,
      totalUsers: users.length,
    })
  } catch (error) {
    logger.error('Error processing email digest cron', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}

