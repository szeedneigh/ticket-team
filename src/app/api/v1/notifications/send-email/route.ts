/**
 * Send Email Notification API Route
 *
 * POST /api/v1/notifications/send-email
 *
 * Handles sending email notifications for various events
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTicketNotification, sendWelcomeEmail } from '@/lib/email/service'
import type { TicketNotificationData, WelcomeEmailData } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, data' },
        { status: 400 }
      )
    }

    // Handle different email types
    switch (type) {
      case 'ticket_notification': {
        const ticketData = data as TicketNotificationData
        const result = await sendTicketNotification(ticketData)

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          )
        }

        logger.info('Ticket notification email sent via API', {
          messageId: result.messageId,
          ticketId: ticketData.ticketId,
          userId: user.id,
        })

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
        })
      }

      case 'welcome': {
        const welcomeData = data as WelcomeEmailData
        const result = await sendWelcomeEmail(welcomeData)

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          )
        }

        logger.info('Welcome email sent via API', {
          messageId: result.messageId,
          userId: user.id,
        })

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Error in send-email API route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      },
      { status: 500 }
    )
  }
}
