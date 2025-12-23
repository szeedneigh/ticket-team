/**
 * Server-Side AI Event Logging Utilities
 * 
 * Functions to log AI events directly to the database from server actions.
 * Use these in Server Components, Server Actions, and API Routes.
 * 
 * CRITICAL: This file is SERVER-ONLY. Never import in client components.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  LogAiEventInput,
  LogPromptInput,
  LogAutomationInput,
  AiEvent,
  AiPromptLog,
  AiAutomationRun,
} from '@/lib/types/ai-events'

// ============================================================================
// AI Event Logging
// ============================================================================

/**
 * Log an AI event to the database
 * 
 * @param input - Event data to log
 * @param useServiceClient - If true, bypasses RLS (for system events)
 * @returns The created event ID or null on error
 */
export async function logAIEvent(
  input: LogAiEventInput,
  useServiceClient = false
): Promise<string | null> {
  try {
    const supabase = useServiceClient ? createServiceClient() : await createClient()

    // Get current user if not using service client
    let userId = input.userId
    let userRole = input.userRole

    if (!useServiceClient && !userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        
        // Fetch user role from users table
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        userRole = userData?.role
      }
    }

    const { data, error } = await supabase
      .from('ai_events')
      .insert({
        event_type: input.eventType,
        surface: input.surface,
        content: input.content,
        sensitivity: input.sensitivity || 'internal',
        user_id: userId,
        user_role: userRole,
        session_id: input.sessionId,
        metadata: input.metadata || {},
        ticket_id: input.ticketId,
        comment_id: input.commentId,
        article_id: input.articleId,
        parent_event_id: input.parentEventId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[logAIEvent] Error:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('[logAIEvent] Exception:', error)
    return null
  }
}

/**
 * Log an AI event with feedback
 * 
 * @param eventId - Event ID to update
 * @param score - Feedback score (-1, 0, 1)
 * @param text - Optional feedback text
 */
export async function addEventFeedback(
  eventId: string,
  score: number,
  text?: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('ai_events')
      .update({
        feedback_score: score,
        feedback_text: text,
      })
      .eq('id', eventId)

    if (error) {
      console.error('[addEventFeedback] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[addEventFeedback] Exception:', error)
    return false
  }
}

// ============================================================================
// Prompt Logging
// ============================================================================

/**
 * Log a prompt/completion interaction with the AI model
 * 
 * @param input - Prompt log data
 * @returns The created log ID or null on error
 */
export async function logPrompt(
  input: LogPromptInput
): Promise<string | null> {
  try {
    const supabase = await createClient()

    // Get current user if not provided
    let userId = input.userId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    const { data, error } = await supabase
      .from('ai_prompt_logs')
      .insert({
        event_id: input.eventId,
        model: input.model,
        prompt: input.prompt,
        system_instruction: input.systemInstruction,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        completion: input.completion,
        finish_reason: input.finishReason,
        prompt_tokens: input.promptTokens,
        completion_tokens: input.completionTokens,
        total_tokens: input.totalTokens,
        latency_ms: input.latencyMs,
        context_sources: input.contextSources,
        retrieval_query: input.retrievalQuery,
        retrieval_count: input.retrievalCount,
        error_message: input.errorMessage,
        user_id: userId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[logPrompt] Error:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('[logPrompt] Exception:', error)
    return null
  }
}

/**
 * Add user feedback to a prompt log
 * 
 * @param promptLogId - Prompt log ID to update
 * @param score - Feedback score (-1, 0, 1)
 * @param text - Optional feedback text
 */
export async function addPromptFeedback(
  promptLogId: string,
  score: number,
  text?: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('ai_prompt_logs')
      .update({
        user_feedback_score: score,
        user_feedback_text: text,
      })
      .eq('id', promptLogId)

    if (error) {
      console.error('[addPromptFeedback] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[addPromptFeedback] Exception:', error)
    return false
  }
}

// ============================================================================
// Automation Logging
// ============================================================================

/**
 * Log an automation run
 * 
 * @param input - Automation run data
 * @returns The created run ID or null on error
 */
export async function logAutomation(
  input: LogAutomationInput
): Promise<string | null> {
  try {
    const supabase = createServiceClient() // Always use service client for automation

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('ai_automation_runs')
      .insert({
        automation_type: input.automationType,
        trigger_event_id: input.triggerEventId,
        input_data: input.inputData,
        output_data: input.outputData,
        confidence_score: input.confidenceScore,
        status: input.status || 'pending',
        error_message: input.errorMessage,
        started_at: input.status === 'running' ? now : null,
        completed_at: input.status === 'completed' ? now : null,
        action_taken: input.actionTaken,
        result_event_id: input.resultEventId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[logAutomation] Error:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('[logAutomation] Exception:', error)
    return null
  }
}

/**
 * Update an automation run status
 * 
 * @param runId - Automation run ID
 * @param status - New status
 * @param outputData - Optional output data
 * @param errorMessage - Optional error message
 */
export async function updateAutomationStatus(
  runId: string,
  status: 'running' | 'completed' | 'failed',
  outputData?: Record<string, unknown>,
  errorMessage?: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient()

    const now = new Date().toISOString()
    const updates: Record<string, unknown> = { status }

    if (status === 'running') {
      updates.started_at = now
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = now
    }

    if (outputData) {
      updates.output_data = outputData
    }

    if (errorMessage) {
      updates.error_message = errorMessage
    }

    const { error } = await supabase
      .from('ai_automation_runs')
      .update(updates)
      .eq('id', runId)

    if (error) {
      console.error('[updateAutomationStatus] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[updateAutomationStatus] Exception:', error)
    return false
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get recent AI events for a user
 * 
 * @param userId - User ID
 * @param limit - Number of events to fetch
 * @returns Array of AI events
 */
export async function getUserRecentEvents(
  userId: string,
  limit = 50
): Promise<AiEvent[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getUserRecentEvents] Error:', error)
      return []
    }

    return (data || []) as AiEvent[]
  } catch (error) {
    console.error('[getUserRecentEvents] Exception:', error)
    return []
  }
}

/**
 * Get unprocessed AI events (for ingestion pipeline)
 * 
 * @param limit - Number of events to fetch
 * @returns Array of unprocessed AI events
 */
export async function getUnprocessedEvents(
  limit = 100
): Promise<AiEvent[]> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_events')
      .select('*')
      .is('processed_at', null)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[getUnprocessedEvents] Error:', error)
      return []
    }

    return (data || []) as AiEvent[]
  } catch (error) {
    console.error('[getUnprocessedEvents] Exception:', error)
    return []
  }
}

/**
 * Mark an event as processed
 * 
 * @param eventId - Event ID to mark
 * @param embedding - Optional embedding vector
 * @param keywords - Optional extracted keywords
 */
export async function markEventProcessed(
  eventId: string,
  embedding?: number[],
  keywords?: string[]
): Promise<boolean> {
  try {
    const supabase = createServiceClient()

    const updates: Record<string, unknown> = {
      processed_at: new Date().toISOString(),
    }

    if (embedding) {
      updates.embedding = JSON.stringify(embedding)
    }

    if (keywords) {
      updates.keywords = keywords
    }

    const { error } = await supabase
      .from('ai_events')
      .update(updates)
      .eq('id', eventId)

    if (error) {
      console.error('[markEventProcessed] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[markEventProcessed] Exception:', error)
    return false
  }
}



