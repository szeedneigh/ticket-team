'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { FeedbackWithDetails, FeedbackSummary } from '@/lib/types/templates'

/**
 * Feedback Server Actions
 *
 * Server actions for handling ticket feedback submissions.
 * Users can rate their satisfaction (1-5 stars) after ticket resolution.
 */

// ============================================================================
// Types
// ============================================================================

export interface ActionResponse {
  success: boolean
  error?: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

const feedbackSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(500, 'Comment must be less than 500 characters').optional(),
})

type FeedbackInput = z.infer<typeof feedbackSchema>

// ============================================================================
// Feedback Actions
// ============================================================================

/**
 * Submit feedback for a resolved ticket
 * @param input - Feedback data (ticketId, rating, optional comment)
 * @returns Action response with success status
 */
export async function submitTicketFeedback(
  input: FeedbackInput
): Promise<ActionResponse> {
  try {
    // 1. Validate input
    const validatedInput = feedbackSchema.parse(input)
    const { ticketId, rating, comment } = validatedInput

    const supabase = await createClient()

    // 2. Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 3. Verify ticket exists and is resolved
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status, user_id')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return { success: false, error: 'Ticket not found' }
    }

    // Only the ticket submitter can provide feedback
    if (ticket.user_id !== user.id) {
      return { success: false, error: 'You can only provide feedback for your own tickets' }
    }

    // Ticket must be resolved to provide feedback
    if (ticket.status !== 'resolved') {
      return { success: false, error: 'Feedback can only be submitted for resolved tickets' }
    }

    // 4. Check if feedback already exists
    const { data: existingFeedback, error: checkError } = await supabase
      .from('ticket_feedback')
      .select('id')
      .eq('ticket_id', ticketId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      logger.error('Error checking existing feedback', { error: checkError.message, ticketId })
      return { success: false, error: 'Failed to check existing feedback' }
    }

    if (existingFeedback) {
      return { success: false, error: 'You have already submitted feedback for this ticket' }
    }

    // 5. Insert feedback
    const { error: insertError } = await supabase
      .from('ticket_feedback')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        rating,
        comment: comment || null,
      })

    if (insertError) {
      logger.error('Error inserting feedback', { error: insertError.message, ticketId })
      return { success: false, error: 'Failed to submit feedback' }
    }

    // 6. Log activity
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticketId,
        user_id: user.id,
        action: 'feedback_submitted',
        description: `Submitted feedback: ${rating}/5 stars`,
        metadata: {
          rating,
          has_comment: !!comment,
        },
      })
    } catch (activityError) {
      logger.error('Activity logging error', { 
        error: activityError instanceof Error ? activityError.message : 'Unknown error',
        ticketId
      })
      // Don't fail feedback submission if activity logging fails
    }

    // 7. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    logger.error('Unexpected error in submitTicketFeedback', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if user has already submitted feedback for a ticket
 * @param ticketId - Ticket ID to check
 * @returns Boolean indicating if feedback exists
 */
export async function hasFeedback(ticketId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('ticket_feedback')
      .select('id')
      .eq('ticket_id', ticketId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      /**
       * IMPORTANT:
       * In some environments, RLS for `ticket_feedback` intentionally restricts
       * employees from selecting from this table directly (to keep feedback
       * analytics staff-only), which can cause "permission denied" errors here.
       *
       * When that happens, returning `false` would cause the UI to think the
       * user has not submitted feedback yet and keep re-opening the feedback
       * prompt, even though the submit action itself correctly prevents
       * duplicates.
       *
       * To avoid repeatedly nagging the user (and to keep the UX consistent
       * with the server-side duplicate check), we treat any unexpected error
       * as "feedback already exists" for the purpose of showing the prompt.
       */
      logger.error('Error checking feedback; assuming feedback exists', {
        error: error.message,
        ticketId,
      })
      return true
    }

    return !!data
  } catch (error) {
    logger.error('Error in hasFeedback; assuming feedback exists', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId,
    })
    // Fail closed for the prompt: if we can't reliably check,
    // prefer to NOT show the feedback modal again.
    return true
  }
}

/**
 * Whether any feedback row exists for this ticket (staff/admin/super_admin only).
 * Uses service client because RLS restricts feedback reads to super_admin.
 */
export async function hasAnyFeedbackOnTicket(ticketId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (
      !userData ||
      !['staff', 'admin', 'super_admin'].includes(userData.role)
    ) {
      return false
    }

    const service = createServiceClient()
    const { count, error } = await service
      .from('ticket_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId)

    if (error) {
      logger.error('hasAnyFeedbackOnTicket error', {
        error: error.message,
        ticketId,
      })
      return false
    }

    return (count ?? 0) > 0
  } catch (error) {
    logger.error('hasAnyFeedbackOnTicket unexpected', {
      error: error instanceof Error ? error.message : 'Unknown',
      ticketId,
    })
    return false
  }
}

// ============================================================================
// Admin Feedback Analytics (RLS-aware: super_admin sees all, admin sees aggregate)
// ============================================================================

export interface FeedbackAnalyticsResult {
  success: boolean
  feedback?: FeedbackWithDetails[]
  summary?: FeedbackSummary | null
  totalCount?: number
  page?: number
  pageSize?: number
  error?: string
}

/**
 * Fetch feedback analytics for admin settings.
 * - super_admin: Paginated feedback list + accurate summary via RPC (bypasses RLS via service client)
 * - admin: Aggregate summary only via get_satisfaction_aggregate RPC (no individual feedback)
 */
export async function getFeedbackAnalytics(
  ratingFilter?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<FeedbackAnalyticsResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (!role || !['admin', 'super_admin'].includes(role)) {
      return { success: false, error: 'Admin access required' }
    }

    if (role === 'super_admin') {
      const serviceSupabase = createServiceClient()

      // Use get_satisfaction_aggregate for accurate summary regardless of page
      const { data: aggregate, error: aggError } = await serviceSupabase.rpc(
        'get_satisfaction_aggregate',
        {
          start_date: new Date(0).toISOString(),
          end_date: new Date().toISOString(),
        }
      )

      if (aggError) {
        logger.error('Error fetching satisfaction aggregate', { error: aggError.message })
      }

      // Paginated feedback list
      const offset = (page - 1) * pageSize
      let query = serviceSupabase
        .from('ticket_feedback')
        .select(
          `
          *,
          ticket:tickets(id, title, category, status, created_at),
          user:users(id, full_name, email)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (ratingFilter && ratingFilter !== 'all') {
        query = query.eq('rating', parseInt(ratingFilter))
      }

      const { data: feedback, error, count } = await query

      if (error) {
        logger.error('Error fetching feedback', { error: error.message })
        return { success: false, error: error.message }
      }

      const dist = aggregate?.distribution || {}
      const total = aggregate?.totalResponses || 0
      const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
        const c = Number(dist[String(rating)] ?? 0)
        return {
          rating,
          count: c,
          percentage: total > 0 ? Math.round((c / total) * 100) : 0,
        }
      })

      const summary: FeedbackSummary = {
        totalFeedback: total,
        averageRating: Number(aggregate?.overallScore ?? 0),
        ratingDistribution,
        recentTrend: computeRecentTrend(feedback || []),
      }

      return {
        success: true,
        feedback: (feedback || []) as FeedbackWithDetails[],
        summary,
        totalCount: count ?? 0,
        page,
        pageSize,
      }
    }

    // admin: use get_satisfaction_aggregate RPC
    const { data: aggregate, error } = await supabase.rpc('get_satisfaction_aggregate', {
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString(),
    })

    if (error) {
      logger.error('Error fetching satisfaction aggregate', { error: error.message })
      return { success: false, error: error.message }
    }

    const dist = aggregate?.distribution || {}
    const total = aggregate?.totalResponses || 0
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
      const count = Number(dist[String(rating)] ?? 0)
      return {
        rating,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })

    const summary: FeedbackSummary = {
      totalFeedback: total,
      averageRating: Number(aggregate?.overallScore ?? 0),
      ratingDistribution,
      recentTrend: [],
    }

    return { success: true, feedback: [], summary }
  } catch (error) {
    logger.error('Error in getFeedbackAnalytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load feedback',
    }
  }
}

function computeRecentTrend(
  feedback: { rating: number; created_at: string }[]
): FeedbackSummary['recentTrend'] {
  if (!feedback.length) return []

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentFeedback = feedback.filter(
    (f) => new Date(f.created_at) >= thirtyDaysAgo
  )

  const byDate = recentFeedback.reduce(
    (acc, f) => {
      const date = f.created_at.split('T')[0]
      if (!acc[date]) acc[date] = { total: 0, count: 0 }
      acc[date].total += f.rating
      acc[date].count++
      return acc
    },
    {} as Record<string, { total: number; count: number }>
  )

  return Object.entries(byDate)
    .map(([date, { total, count }]) => ({
      date,
      avgRating: Math.round((total / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
