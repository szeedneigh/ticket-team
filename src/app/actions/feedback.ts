'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

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
      logger.error('Error checking feedback', { error: error.message, ticketId })
      return false
    }

    return !!data
  } catch (error) {
    logger.error('Error in hasFeedback', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId
    })
    return false
  }
}
