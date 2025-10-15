/**
 * AI Interaction Domain Types
 * 
 * Type definitions for AI assistant, RAG, and embeddings
 */

// ============================================================================
// AI Interaction Types
// ============================================================================

export interface AIInteraction {
  id: string
  user_id: string | null
  session_id: string
  query: string
  response: string
  context_articles: string[] // UUID array
  was_helpful: boolean | null
  escalated_to_ticket: boolean
  ticket_id: string | null
  response_time_ms: number | null
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface ChatSession {
  session_id: string
  messages: ChatMessage[]
  context_articles?: string[]
  created_at: string
  updated_at: string
}

// ============================================================================
// RAG (Retrieval-Augmented Generation) Types
// ============================================================================

export interface RAGContext {
  article_id: string
  title: string
  content: string
  similarity: number
  metadata?: Record<string, unknown>
}

export interface RAGRequest {
  query: string
  session_id?: string
  user_id?: string
  include_context?: boolean
  max_context_articles?: number
}

export interface RAGResponse {
  answer: string
  context_articles: RAGContext[]
  suggested_articles?: string[]
  should_escalate?: boolean
  escalation_reason?: string
  response_time_ms: number
  metadata?: Record<string, unknown>
}

// ============================================================================
// Embedding Types
// ============================================================================

export interface EmbeddingRequest {
  text: string
  model?: string // default: 'text-embedding-3-small'
}

export interface EmbeddingResponse {
  embedding: number[] // 1536 dimensions
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// ============================================================================
// Feedback Types
// ============================================================================

export interface AIFeedback {
  interaction_id: string
  was_helpful: boolean
  feedback_text?: string
  escalate_to_ticket?: boolean
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AIStats {
  total_interactions: number
  helpful_count: number
  unhelpful_count: number
  escalation_count: number
  avg_response_time_ms: number
  helpfulness_rate: number
  escalation_rate: number
  most_common_queries: Array<{ query: string; count: number }>
}

export interface AISessionStats {
  session_id: string
  total_messages: number
  escalated: boolean
  avg_response_time_ms: number
  helpful_interactions: number
  unhelpful_interactions: number
}

