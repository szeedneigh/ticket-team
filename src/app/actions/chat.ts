/**
 * Chat Server Actions
 *
 * Server actions for managing chat sessions, feedback, and escalation to tickets.
 * All actions validate user authentication and handle errors gracefully.
 *
 * @module app/actions/chat
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSystemConfig } from '@/lib/settings/actions'
import { pickAssigneeForTicket } from '@/lib/tickets/assignment'
import { notifyTicketAssignment } from '@/lib/email/notifications'
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types'
import {
  createSession,
  archiveSession,
  updateInteractionFeedback,
  linkInteractionToTicket,
  getSessionsByUserId,
  getSessionWithMessages,
  type SessionSummary,
} from '@/lib/chat/queries'
import {
  detectCategory,
  suggestStaffAssignment,
  generateTicketTitle,
  formatTicketDescription,
  suggestPriority,
  type TicketPreparation,
} from '@/lib/chat/escalation-utils'
import type { TicketPriority } from '@/lib/types/database'
import type {
  ChatSessionWithMessages,
  ChatMessage,
  RAGContext,
} from '@/lib/types/ai'
import { logger } from '@/lib/logger'

// ============================================================================
// Action Response Types
// ============================================================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Session Management Actions
// ============================================================================

/**
 * Create a new chat session
 *
 * @returns The new session ID or error
 */
export async function createChatSession(): Promise<
  ActionResponse<{ sessionId: string }>
> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to create a chat session',
      }
    }

    // Create new session
    const sessionId = await createSession(user.id)

    return {
      success: true,
      data: { sessionId },
    }
  } catch (error) {
    logger.error('Error creating chat session', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      success: false,
      error: 'Failed to create chat session. Please try again.',
    }
  }
}

/**
 * Archive a chat session (soft delete)
 *
 * @param sessionId - The session ID to archive
 * @returns Success status or error
 */
export async function archiveChatSession(
  sessionId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to archive a chat session',
      }
    }

    // Archive session
    await archiveSession(sessionId, user.id)

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    logger.error('Error archiving chat session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    })
    return {
      success: false,
      error: 'Failed to archive chat session. Please try again.',
    }
  }
}

/**
 * Get archived chat sessions
 *
 * @param params - Query parameters (limit, offset)
 * @returns Array of archived session summaries or error
 */
export async function getArchivedChatSessions(params?: {
  limit?: number
  offset?: number
}): Promise<ActionResponse<SessionSummary[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view archived chat sessions',
      }
    }

    const limit = params?.limit ?? 50
    const offset = params?.offset ?? 0

    const { data, error: queryError } = await supabase.rpc(
      'get_archived_chat_sessions',
      {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      }
    )

    if (queryError) {
      logger.error('Error querying archived sessions via RPC', {
        error: queryError.message,
      })
      return {
        success: false,
        error: 'Failed to fetch archived chat sessions',
      }
    }

    const archivedSessions: SessionSummary[] = (data ?? []).map(
      (row: {
        session_id: string
        title: string | null
        last_message: string
        last_message_at: string
        message_count: number
        escalated: boolean
      }) => ({
        session_id: row.session_id,
        title: row.title,
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        message_count: row.message_count,
        escalated: row.escalated,
      })
    )

    logger.info('[getArchivedChatSessions] Returning archived sessions:', {
      count: archivedSessions.length,
      sessionIds: archivedSessions.map((s) => s.session_id),
    })

    return {
      success: true,
      data: archivedSessions,
    }
  } catch (error) {
    logger.error('Error fetching archived chat sessions', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return {
      success: false,
      error: 'Failed to fetch archived chat sessions. Please try again.',
    }
  }
}

/**
 * Get user's chat sessions
 *
 * @param params - Query parameters (limit, offset)
 * @returns Array of session summaries or error
 */
export async function getUserChatSessions(params?: {
  limit?: number
  offset?: number
}): Promise<ActionResponse<SessionSummary[]>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view chat sessions',
      }
    }

    // Get sessions
    const sessions = await getSessionsByUserId({
      userId: user.id,
      limit: params?.limit,
      offset: params?.offset,
    })

    return {
      success: true,
      data: sessions,
    }
  } catch (error) {
    logger.error('Error fetching chat sessions', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      success: false,
      error: 'Failed to fetch chat sessions. Please try again.',
    }
  }
}

/**
 * Get a specific chat session with messages
 *
 * @param sessionId - The session ID
 * @returns Session with messages or error
 */
export async function getChatSession(
  sessionId: string
): Promise<ActionResponse<ChatSessionWithMessages | null>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view chat sessions',
      }
    }

    // Get session with messages
    const session = await getSessionWithMessages(sessionId, user.id)

    return {
      success: true,
      data: session,
    }
  } catch (error) {
    logger.error('Error fetching chat session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    })
    return {
      success: false,
      error: 'Failed to fetch chat session. Please try again.',
    }
  }
}

// ============================================================================
// Feedback Actions
// ============================================================================

export interface SubmitFeedbackParams {
  interactionId: string
  wasHelpful: boolean
  feedbackText?: string
}

/**
 * Submit feedback for an AI interaction
 *
 * Records whether the user found the AI response helpful.
 *
 * @param params - Feedback parameters
 * @returns Success status or error
 */
export async function submitFeedback(
  params: SubmitFeedbackParams
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to submit feedback',
      }
    }

    // Verify the interaction belongs to the user
    const { data: interaction, error: verifyError } = await supabase
      .from('ai_interactions')
      .select('user_id')
      .eq('id', params.interactionId)
      .single()

    if (verifyError || !interaction) {
      return {
        success: false,
        error: 'Interaction not found',
      }
    }

    if (interaction.user_id !== user.id) {
      return {
        success: false,
        error: 'You can only provide feedback on your own interactions',
      }
    }

    // Update feedback
    await updateInteractionFeedback(
      params.interactionId,
      params.wasHelpful,
      params.feedbackText
    )

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    logger.error('Error submitting feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      interactionId: params.interactionId
    })
    return {
      success: false,
      error: 'Failed to submit feedback. Please try again.',
    }
  }
}

// ============================================================================
// Escalation Actions (Two-Step Process)
// ============================================================================

/**
 * STEP 1: Prepare ticket data from chat conversation
 *
 * Analyzes the conversation and provides smart suggestions for:
 * - Title (AI-generated)
 * - Description (formatted conversation)
 * - Category (multi-layered detection)
 * - Priority (based on urgency indicators)
 * - Staff assignment (workload-based)
 *
 * User can review and modify all suggestions before creating the ticket.
 *
 * @param params - Preparation parameters
 * @returns Prepared ticket data with suggestions
 */
export async function prepareTicketFromChat(params: {
  sessionId: string
  interactionId: string
}): Promise<ActionResponse<TicketPreparation>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to prepare a ticket',
      }
    }

    // Get the specific interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('id', params.interactionId)
      .single()

    if (interactionError || !interaction) {
      return {
        success: false,
        error: 'Interaction not found',
      }
    }

    if (interaction.user_id !== user.id) {
      return {
        success: false,
        error: 'You can only prepare tickets from your own conversations',
      }
    }

    // Get all interactions in the session for full context
    const { data: sessionInteractions, error: sessionError } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('created_at', { ascending: true })

    // Debug logging
    logger.info('[prepareTicketFromChat] Session query:', {
      sessionId: params.sessionId,
      interactionId: params.interactionId,
      foundInteractions: sessionInteractions?.length ?? 0,
    })

    if (sessionError || !sessionInteractions) {
      logger.error('[prepareTicketFromChat] Session query failed:', { error: sessionError?.message })
      return {
        success: false,
        error: 'Failed to retrieve conversation history',
      }
    }

    // More debug logging
    if (sessionInteractions.length > 0) {
      logger.info('[prepareTicketFromChat] First query in session:', {
        query: sessionInteractions[0].query.substring(0, 50),
        created: sessionInteractions[0].created_at,
      })
    }

    // Convert to ChatMessage format
    const conversationContext: ChatMessage[] = []
    for (const int of sessionInteractions) {
      conversationContext.push({
        role: 'user',
        content: int.query,
        timestamp: int.created_at,
      })
      conversationContext.push({
        role: 'assistant',
        content: int.response,
        timestamp: int.created_at,
      })
    }

    // Get context articles for the current interaction
    const contextArticles: RAGContext[] = []
    if (interaction.context_articles && interaction.context_articles.length > 0) {
      const { data: articles } = await supabase
        .from('knowledge_articles')
        .select('id, title, content, category')
        .in('id', interaction.context_articles)

      if (articles) {
        contextArticles.push(
          ...articles.map(a => ({
            article_id: a.id,
            title: a.title,
            content: a.content,
            similarity: 0.8, // Approximate since we don't have stored similarity
            metadata: { category: a.category },
          }))
        )
      }
    }

    // Generate title
    const suggestedTitle = await generateTicketTitle(
      interaction.query,
      conversationContext
    )

    // Detect category with confidence
    const categoryResult = await detectCategory({
      query: interaction.query,
      contextArticles,
      conversation: conversationContext,
    })

    // Format description (concise summary instead of full chat dump)
    const suggestedDescription = await formatTicketDescription({
      conversation: conversationContext,
      contextArticles,
    })

    // Suggest priority
    const suggestedPriority = suggestPriority(
      interaction.query,
      conversationContext
    )

    // Suggest staff assignment
    const suggestedStaff = await suggestStaffAssignment({
      category: categoryResult.category,
      priority: suggestedPriority,
      description: suggestedDescription,
    })

    return {
      success: true,
      data: {
        suggestedTitle,
        suggestedDescription,
        suggestedCategory: categoryResult.category,
        categoryConfidence: categoryResult.confidence,
        suggestedPriority,
        suggestedStaff,
        conversationContext,
      },
    }
  } catch (error) {
    logger.error('Error preparing ticket', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: params.sessionId,
      interactionId: params.interactionId
    })
    return {
      success: false,
      error: 'Failed to prepare ticket data. Please try again.',
    }
  }
}

/**
 * STEP 2: Create ticket from reviewed data
 *
 * Creates the ticket after user has reviewed and possibly modified
 * the suggested data. Links the ticket to the AI interaction.
 *
 * @param params - Reviewed ticket data
 * @returns The created ticket ID or error
 */
export async function createTicketFromChat(params: {
  interactionId: string
  sessionId: string
  title: string
  description: string
  category: string
  priority: TicketPriority
  assignedTo?: string
  userAdditions?: string
}): Promise<ActionResponse<{ ticketId: string }>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to create a ticket',
      }
    }

    // Get the interaction and session context
    const { data: interaction, error: interactionError } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('id', params.interactionId)
      .single()

    if (interactionError || !interaction) {
      return {
        success: false,
        error: 'Interaction not found',
      }
    }

    if (interaction.user_id !== user.id) {
      return {
        success: false,
        error: 'You can only escalate your own interactions',
      }
    }

    // Use user-reviewed data to create the ticket
    // User has already reviewed title, description, category, priority, and staff
    const finalDescription = params.userAdditions
      ? `**Additional Context from User:**\n\n${params.userAdditions}\n\n---\n\n${params.description}`
      : params.description

    // Resolve assigned_to: auto-assign when enabled and user did not pick someone
    let finalAssignedTo: string | null = params.assignedTo || null
    let isAutoAssigned = false
    const config = await getSystemConfig()
    if (config?.auto_assignment_enabled && !params.assignedTo) {
      const staffId = await pickAssigneeForTicket({
        category: params.category,
        priority: params.priority,
      })
      if (staffId) {
        finalAssignedTo = staffId
        isAutoAssigned = true
      }
    }

    // Create the ticket with reviewed data
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: params.title,
        description: finalDescription,
        category: params.category,
        priority: params.priority,
        status: 'open',
        user_id: user.id,
        assigned_to: finalAssignedTo,
        metadata: {
          escalated_from_chat: true,
          session_id: params.sessionId,
          interaction_id: params.interactionId,
          created_via_ai_assistant: true,
        },
      })
      .select('id')
      .single()

    if (ticketError || !ticket) {
      logger.error('Error creating ticket', {
        error: ticketError?.message,
        sessionId: params.sessionId,
        interactionId: params.interactionId
      })
      return {
        success: false,
        error: 'Failed to create ticket. Please try again.',
      }
    }

    // Log activity and notify when auto-assigned
    if (isAutoAssigned && finalAssignedTo) {
      try {
        const serviceClient = createServiceClient()
        const { data: assigneeData } = await serviceClient
          .from('users')
          .select('full_name')
          .eq('id', finalAssignedTo)
          .single()

        await serviceClient.from('ticket_activities').insert({
          ticket_id: ticket.id,
          user_id: null,
          action: ACTIVITY_TYPES.TICKET_ASSIGNED,
          old_value: null,
          new_value: finalAssignedTo,
          metadata: {
            auto_assigned: true,
            assigned_to_name: assigneeData?.full_name || 'Staff',
          },
        })

        notifyTicketAssignment(ticket.id, finalAssignedTo, 'System').catch((err) => {
          logger.error('Auto-assignment email error', { error: err, ticketId: ticket.id })
        })
      } catch (activityError) {
        logger.error('Auto-assignment activity log error', {
          error: activityError instanceof Error ? activityError.message : 'Unknown',
          ticketId: ticket.id,
        })
      }
    }

    // Link the interaction to the ticket
    await linkInteractionToTicket(params.interactionId, ticket.id)

    return {
      success: true,
      data: { ticketId: ticket.id },
    }
  } catch (error) {
    logger.error('Error creating ticket from chat', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: params.sessionId,
      interactionId: params.interactionId
    })
    return {
      success: false,
      error: 'Failed to create ticket. Please try again.',
    }
  }
}
