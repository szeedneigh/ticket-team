/**
 * AI Events Type Definitions
 * 
 * Types matching the database schema for AI event tracking,
 * ingestion, and automation.
 */

// ============================================================================
// Database Enums
// ============================================================================

export type AiEventType =
  | 'message'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_comment'
  | 'ticket_assigned'
  | 'ticket_status_change'
  | 'kb_created'
  | 'kb_updated'
  | 'kb_viewed'
  | 'kb_voted'
  | 'search_query'
  | 'assistant_query'
  | 'assistant_response'
  | 'automation_triggered'
  | 'feedback_given'

export type AiEventSurface =
  | 'dashboard'
  | 'ticket_list'
  | 'ticket_view'
  | 'ticket_composer'
  | 'comment_composer'
  | 'kb_list'
  | 'kb_view'
  | 'kb_editor'
  | 'search_box'
  | 'assistant_panel'
  | 'assistant_inline'
  | 'automation_worker'
  | 'api'
  | 'system'

export type AiEventSensitivity =
  | 'public'
  | 'internal'
  | 'sensitive'
  | 'restricted'

export type UserRole =
  | 'employee'
  | 'staff'
  | 'admin'
  | 'super_admin'

// ============================================================================
// AI Event Interfaces
// ============================================================================

export interface AiEvent {
  id: string
  event_type: AiEventType
  surface: AiEventSurface
  sensitivity: AiEventSensitivity
  user_id?: string
  user_role?: UserRole
  session_id?: string
  content: string
  content_normalized?: string
  metadata?: Record<string, unknown>
  ticket_id?: string
  comment_id?: string
  article_id?: string
  parent_event_id?: string
  embedding?: number[]
  keywords?: string[]
  entities?: Record<string, unknown>
  intent?: string
  outcome?: string
  outcome_confidence?: number
  feedback_score?: number
  feedback_text?: string
  processed_at?: string
  indexed_at?: string
  error_message?: string
  created_at: string
}

export interface AiEventEmbedding {
  id: string
  event_id: string
  embedding: number[]
  content_summary: string
  event_type: AiEventType
  sensitivity: AiEventSensitivity
  user_role?: UserRole
  metadata?: Record<string, unknown>
  created_at: string
}

export interface AiPromptLog {
  id: string
  event_id?: string
  model: string
  prompt: string
  system_instruction?: string
  temperature?: number
  max_tokens?: number
  completion?: string
  finish_reason?: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  latency_ms?: number
  context_sources?: string[]
  retrieval_query?: string
  retrieval_count?: number
  error_message?: string
  user_feedback_score?: number
  user_feedback_text?: string
  user_id?: string
  created_at: string
}

export interface AiAutomationRun {
  id: string
  automation_type: string
  trigger_event_id?: string
  input_data: Record<string, unknown>
  output_data?: Record<string, unknown>
  confidence_score?: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  error_message?: string
  started_at?: string
  completed_at?: string
  duration_ms?: number
  action_taken?: string
  result_event_id?: string
  created_at: string
}

// ============================================================================
// Input Types for Logging
// ============================================================================

export interface LogAiEventInput {
  eventType: AiEventType
  surface: AiEventSurface
  content: string
  sensitivity?: AiEventSensitivity
  userId?: string
  userRole?: UserRole
  sessionId?: string
  metadata?: Record<string, unknown>
  ticketId?: string
  commentId?: string
  articleId?: string
  parentEventId?: string
}

export interface LogPromptInput {
  model: string
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxTokens?: number
  completion?: string
  finishReason?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  latencyMs?: number
  contextSources?: string[]
  retrievalQuery?: string
  retrievalCount?: number
  errorMessage?: string
  eventId?: string
  userId?: string
}

export interface LogAutomationInput {
  automationType: string
  triggerEventId?: string
  inputData: Record<string, unknown>
  outputData?: Record<string, unknown>
  confidenceScore?: number
  status?: 'pending' | 'running' | 'completed' | 'failed'
  errorMessage?: string
  actionTaken?: string
  resultEventId?: string
}

// ============================================================================
// RAG Context Types
// ============================================================================

export interface RAGSource {
  id: string
  type: 'kb_article' | 'ticket' | 'comment' | 'event'
  title?: string
  content: string
  similarity: number
  metadata?: Record<string, unknown>
}

export interface RAGContext {
  sources: RAGSource[]
  query: string
  totalFound: number
  searchTimeMs: number
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface AiEventSearchResult {
  id: string
  event_type: AiEventType
  surface: AiEventSurface
  content: string
  metadata?: Record<string, unknown>
  user_role?: UserRole
  ticket_id?: string
  article_id?: string
  similarity: number
  created_at: string
}

export interface AiEmbeddingSearchResult {
  id: string
  event_id: string
  content_summary: string
  event_type: AiEventType
  sensitivity: AiEventSensitivity
  user_role?: UserRole
  metadata?: Record<string, unknown>
  similarity: number
  created_at: string
}

// ============================================================================
// Automation Types
// ============================================================================

export interface TicketTriageSuggestion {
  priority: 'low' | 'medium' | 'high'
  category: string
  subcategory?: string
  confidence: number
  reasoning: string
}

export interface TicketSummary {
  summary: string
  keyPoints: string[]
  suggestedActions?: string[]
  confidence: number
}

// ============================================================================
// Client-side Batch Types
// ============================================================================

export interface ClientAiEvent {
  eventType: AiEventType
  surface: AiEventSurface
  content: string
  sensitivity?: AiEventSensitivity
  sessionId?: string
  metadata?: Record<string, unknown>
  ticketId?: string
  commentId?: string
  articleId?: string
  timestamp: number
}

export interface BatchAiEventsPayload {
  events: ClientAiEvent[]
}






