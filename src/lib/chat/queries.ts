/**
 * Chat Database Queries
 *
 * This module provides database query functions for chat sessions and AI interactions.
 * All functions use the server Supabase client and respect RLS policies.
 *
 * @module lib/chat/queries
 */

import { createClient } from '@/lib/supabase/server'
import type {
  AIInteraction,
  ChatMessage,
  ChatSessionWithMessages,
} from '@/lib/types/ai'

// ============================================================================
// Session Queries
// ============================================================================

export interface GetSessionsParams {
  userId: string
  limit?: number
  offset?: number
  includeArchived?: boolean // NEW parameter
}

export interface SessionSummary {
  session_id: string
  title: string | null
  last_message: string
  last_message_at: string
  message_count: number
  escalated: boolean
}

/**
 * Get all chat sessions for a user with summary information
 *
 * Uses DB-level RPC for efficient grouping and pagination instead of
 * fetching all rows and slicing in memory.
 *
 * @param params - Query parameters
 * @returns Array of session summaries
 */
export async function getSessionsByUserId(
  params: GetSessionsParams
): Promise<SessionSummary[]> {
  const { userId, limit = 50, offset = 0, includeArchived = false } = params

  const supabase = await createClient()

  if (includeArchived) {
    // When including archived, fall back to querying both RPCs and merging
    const [activeResult, archivedResult] = await Promise.all([
      supabase.rpc('get_active_chat_sessions', {
        p_user_id: userId,
        p_limit: limit + offset,
        p_offset: 0,
      }),
      supabase.rpc('get_archived_chat_sessions', {
        p_user_id: userId,
        p_limit: limit + offset,
        p_offset: 0,
      }),
    ])

    if (activeResult.error) {
      throw new Error(`Failed to fetch active sessions: ${activeResult.error.message}`)
    }
    if (archivedResult.error) {
      throw new Error(`Failed to fetch archived sessions: ${archivedResult.error.message}`)
    }

    const all = [...(activeResult.data ?? []), ...(archivedResult.data ?? [])]
    return mapRpcRows(all)
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      .slice(offset, offset + limit)
  }

  const { data, error } = await supabase.rpc('get_active_chat_sessions', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    throw new Error(`Failed to fetch chat sessions: ${error.message}`)
  }

  return mapRpcRows(data ?? [])
}

function mapRpcRows(
  rows: Array<{
    session_id: string
    title: string | null
    last_message: string
    last_message_at: string
    message_count: number
    escalated: boolean
  }>
): SessionSummary[] {
  return rows.map((row) => ({
    session_id: row.session_id,
    title: row.title,
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    message_count: row.message_count,
    escalated: row.escalated,
  }))
}

/**
 * Get all messages for a specific session
 *
 * Returns messages in chronological order (oldest first).
 * Converts AI interactions into chat message format.
 *
 * @param sessionId - The session ID to fetch messages for
 * @returns Array of chat messages
 */
export async function getSessionMessages(
  sessionId: string,
  includeArchived: boolean = false
): Promise<ChatMessage[]> {
  const supabase = await createClient()

  let query = supabase
    .from('ai_interactions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  // Filter archived unless explicitly requested
  if (!includeArchived) {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching session messages:', error)
    throw new Error(`Failed to fetch session messages: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Convert interactions to chat messages (user query + AI response)
  const messages: ChatMessage[] = []

  for (const interaction of data) {
    // Add user message
    messages.push({
      role: 'user',
      content: interaction.query,
      timestamp: interaction.created_at,
      metadata: {
        interaction_id: interaction.id,
      },
    })

    // Add assistant response
    messages.push({
      role: 'assistant',
      content: interaction.response,
      timestamp: interaction.created_at,
      metadata: {
        interaction_id: interaction.id,
        was_helpful: interaction.was_helpful,
        response_time_ms: interaction.response_time_ms,
      },
      sources: interaction.context_articles
        ? interaction.context_articles.map((id: string) => ({
            article_id: id,
            title: '',
            content: '',
            similarity: 0,
          }))
        : undefined,
    })
  }

  return messages
}

/**
 * Get full session details with messages
 *
 * @param sessionId - The session ID
 * @param userId - The user ID (for verification)
 * @returns Session with all messages
 */
export async function getSessionWithMessages(
  sessionId: string,
  userId: string,
  includeArchived: boolean = false
): Promise<ChatSessionWithMessages | null> {
  const supabase = await createClient()

  // Get all interactions for this session
  let query = supabase
    .from('ai_interactions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  // Filter archived unless explicitly requested
  if (!includeArchived) {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching session:', error)
    throw new Error(`Failed to fetch session: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return null
  }

  const messages = await getSessionMessages(sessionId, includeArchived)
  const firstInteraction = data[0]
  const lastInteraction = data[data.length - 1]

  const title =
    (firstInteraction.metadata as Record<string, unknown>)?.session_title as
      | string
      | undefined

  return {
    session_id: sessionId,
    user_id: userId,
    messages,
    context_articles: lastInteraction.context_articles || [],
    title: title ?? undefined,
    created_at: firstInteraction.created_at,
    updated_at: lastInteraction.created_at,
    last_message_at: lastInteraction.created_at,
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a new chat session
 *
 * Generates a unique session ID that will be used to group interactions.
 *
 * @param userId - The user ID
 * @returns New session ID
 */
export async function createSession(userId: string): Promise<string> {
  // Generate a unique session ID
  const sessionId = `chat_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  return sessionId
}

/**
 * Update session title
 *
 * Sets the session title in the metadata of the first interaction.
 * The title is auto-generated from the first user message.
 *
 * @param sessionId - The session ID
 * @param userId - The user ID
 * @param title - The session title
 */
export async function updateSessionTitle(
  sessionId: string,
  userId: string,
  title: string
): Promise<void> {
  const supabase = await createClient()

  // Get the first interaction in the session
  const { data: firstInteraction, error: fetchError } = await supabase
    .from('ai_interactions')
    .select('id, metadata')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (fetchError) {
    console.error('Error fetching first interaction:', fetchError)
    throw new Error(`Failed to fetch first interaction: ${fetchError.message}`)
  }

  // Update metadata with session title
  const metadata = (firstInteraction.metadata as Record<string, unknown>) || {}
  metadata.session_title = title

  const { error: updateError } = await supabase
    .from('ai_interactions')
    .update({ metadata })
    .eq('id', firstInteraction.id)

  if (updateError) {
    console.error('Error updating session title:', updateError)
    throw new Error(`Failed to update session title: ${updateError.message}`)
  }
}

/**
 * Archive a chat session (soft delete)
 *
 * Marks all interactions for the given session as archived.
 * Archived sessions are hidden by default but can be restored.
 *
 * @param sessionId - The session ID to archive
 * @param userId - The user ID (for verification)
 */
export async function archiveSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_interactions')
    .update({ archived_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .is('archived_at', null) // Only archive if not already archived
    .select('id')

  if (error) {
    console.error('Error archiving session:', error)
    throw new Error(`Failed to archive session: ${error.message}`)
  }

  // Verify rows were actually updated (RLS or missing session would return 0)
  if (!data || data.length === 0) {
    console.error('Archive affected 0 rows - session may not exist or RLS blocked update', {
      sessionId,
      userId,
    })
    throw new Error(
      'Failed to archive session. The conversation may not exist or you may not have permission.'
    )
  }
}

// ============================================================================
// Interaction Recording
// ============================================================================

export interface RecordInteractionParams {
  userId: string | null
  sessionId: string
  query: string
  response: string
  contextArticles?: string[]
  responseTimeMs?: number
  metadata?: Record<string, unknown>
}

/**
 * Record a new AI interaction
 *
 * Saves a user query and AI response to the database.
 * This creates an audit trail of all AI conversations.
 *
 * @param params - Interaction parameters
 * @returns The created interaction
 */
export async function recordInteraction(
  params: RecordInteractionParams
): Promise<AIInteraction> {
  const {
    userId,
    sessionId,
    query,
    response,
    contextArticles = [],
    responseTimeMs,
    metadata = {},
  } = params

  const supabase = await createClient()

  // Check if session is archived before recording new interaction
  // A session is archived if ANY interaction has archived_at set (since archiveSession archives all interactions)
  const { data: archivedCheck } = await supabase
    .from('ai_interactions')
    .select('id, archived_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .not('archived_at', 'is', null)
    .limit(1)
    .maybeSingle()
  
  const isArchived = !!archivedCheck && archivedCheck.archived_at !== null

  // Prevent recording new interactions in archived sessions
  if (isArchived) {
    throw new Error('Cannot add messages to archived sessions. Please start a new conversation.')
  }

  const { data, error } = await supabase
    .from('ai_interactions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      query,
      response,
      context_articles: contextArticles,
      response_time_ms: responseTimeMs,
      metadata,
      was_helpful: null,
      escalated_to_ticket: false,
      ticket_id: null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error recording interaction:', error)
    throw new Error(`Failed to record interaction: ${error.message}`)
  }

  return data as AIInteraction
}

/**
 * Update interaction feedback
 *
 * Records whether the user found the AI response helpful.
 *
 * @param interactionId - The interaction ID
 * @param wasHelpful - Whether the response was helpful
 * @param feedbackText - Optional feedback text
 */
export async function updateInteractionFeedback(
  interactionId: string,
  wasHelpful: boolean,
  feedbackText?: string
): Promise<void> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    was_helpful: wasHelpful,
  }

  // Store feedback text in metadata if provided
  if (feedbackText) {
    const { data: existing } = await supabase
      .from('ai_interactions')
      .select('metadata')
      .eq('id', interactionId)
      .single()

    const metadata = (existing?.metadata as Record<string, unknown>) || {}
    metadata.feedback_text = feedbackText
    updateData.metadata = metadata
  }

  const { error } = await supabase
    .from('ai_interactions')
    .update(updateData)
    .eq('id', interactionId)

  if (error) {
    console.error('Error updating interaction feedback:', error)
    throw new Error(`Failed to update feedback: ${error.message}`)
  }
}

/**
 * Link interaction to ticket (escalation)
 *
 * Marks an interaction as escalated and links it to a ticket.
 *
 * @param interactionId - The interaction ID
 * @param ticketId - The created ticket ID
 */
export async function linkInteractionToTicket(
  interactionId: string,
  ticketId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ai_interactions')
    .update({
      escalated_to_ticket: true,
      ticket_id: ticketId,
    })
    .eq('id', interactionId)

  if (error) {
    console.error('Error linking interaction to ticket:', error)
    throw new Error(`Failed to link interaction to ticket: ${error.message}`)
  }
}

// ============================================================================
// Search & Analytics
// ============================================================================

/**
 * Search chat sessions by query text
 *
 * Searches through user queries and AI responses for matching text.
 *
 * @param userId - The user ID
 * @param searchQuery - The search query
 * @param limit - Maximum results to return
 * @returns Array of matching session IDs with context
 */
export async function searchSessions(
  userId: string,
  searchQuery: string,
  limit = 20
): Promise<Array<{ session_id: string; matched_text: string; created_at: string }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_interactions')
    .select('session_id, query, response, created_at')
    .eq('user_id', userId)
    .or(`query.ilike.%${searchQuery}%,response.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching sessions:', error)
    throw new Error(`Failed to search sessions: ${error.message}`)
  }

  return (data || []).map(item => ({
    session_id: item.session_id,
    matched_text: item.query.includes(searchQuery) ? item.query : item.response,
    created_at: item.created_at,
  }))
}
