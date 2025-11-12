/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * This module implements the core RAG pipeline for the AI chat system:
 * 1. Retrieve relevant KB articles using semantic search
 * 2. Augment the prompt with retrieved context
 * 3. Generate grounded responses using Gemini AI
 * 4. Extract citations and calculate confidence
 *
 * @module lib/chat/rag-service
 */

import { createClient } from '@/lib/supabase/server'
import {
  generateEmbedding,
  generateChatResponse,
  generateChatStreamResponse,
  type ChatGenerationParams,
  type ChatGenerationResponse,
  type ChatStreamChunk,
} from '@/lib/ai/client'
import {
  CHAT_SYSTEM_INSTRUCTION,
  buildRAGPrompt,
  calculateConfidenceScore,
  shouldSuggestEscalation,
  isQueryInScope,
  OUT_OF_SCOPE_RESPONSE,
  type KBArticle,
} from '@/lib/chat/prompts'
import type { RAGContext } from '@/lib/types/ai'

// ============================================================================
// Configuration
// ============================================================================

const RAG_CONFIG = {
  SIMILARITY_THRESHOLD: 0.7, // Minimum similarity score to include article
  MAX_ARTICLES: 5, // Maximum number of articles to retrieve
  MIN_CONFIDENCE_FOR_RESPONSE: 0.3, // Minimum confidence to provide answer
} as const

// ============================================================================
// Context Retrieval
// ============================================================================

export interface RetrieveContextParams {
  query: string
  maxArticles?: number
  similarityThreshold?: number
}

export interface RetrieveContextResult {
  articles: RAGContext[]
  confidence: number
  hadResults: boolean
}

/**
 * Retrieve relevant KB articles using semantic search
 *
 * Uses pgvector to find articles similar to the user's query.
 *
 * @param params - Retrieval parameters
 * @returns Retrieved articles with similarity scores
 */
export async function retrieveContext(
  params: RetrieveContextParams
): Promise<RetrieveContextResult> {
  const {
    query,
    maxArticles = RAG_CONFIG.MAX_ARTICLES,
    similarityThreshold = RAG_CONFIG.SIMILARITY_THRESHOLD,
  } = params

  try {
    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(query, {
      taskType: 'RETRIEVAL_QUERY',
    })

    // Query Supabase for similar articles
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('match_kb_articles', {
      query_embedding: queryEmbedding,
      match_threshold: similarityThreshold,
      match_count: maxArticles,
    })

    if (error) {
      console.error('Error retrieving context:', error)
      throw new Error(`Failed to retrieve context: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return {
        articles: [],
        confidence: 0,
        hadResults: false,
      }
    }

    // Transform database results to RAGContext
    const articles: RAGContext[] = data.map((item: {
      id: string
      title: string
      content: string
      category: string
      similarity: number
    }) => ({
      article_id: item.id,
      title: item.title,
      content: item.content,
      similarity: item.similarity,
      metadata: {
        category: item.category,
      },
    }))

    // Calculate confidence based on retrieval quality
    const kbArticles: KBArticle[] = articles.map(a => ({
      id: a.article_id,
      title: a.title,
      content: a.content,
      category: (a.metadata as { category?: string })?.category || 'General',
      similarity: a.similarity,
    }))

    const confidence = calculateConfidenceScore(kbArticles)

    return {
      articles,
      confidence,
      hadResults: true,
    }
  } catch (error) {
    console.error('Context retrieval error:', error)
    throw error
  }
}

// ============================================================================
// RAG Response Generation
// ============================================================================

export interface GenerateRAGResponseParams {
  query: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  maxArticles?: number
  similarityThreshold?: number
  temperature?: number
}

export interface GenerateRAGResponseResult {
  answer: string
  contextArticles: RAGContext[]
  confidence: number
  shouldEscalate: boolean
  responseTimeMs: number
  citations: string[]
}

/**
 * Generate a complete RAG response (non-streaming)
 *
 * Full RAG pipeline: retrieve → augment → generate
 *
 * @param params - Generation parameters
 * @returns Generated response with context and metadata
 */
export async function generateRAGResponse(
  params: GenerateRAGResponseParams
): Promise<GenerateRAGResponseResult> {
  const startTime = Date.now()

  const {
    query,
    conversationHistory = [],
    maxArticles,
    similarityThreshold,
    temperature = 0.7,
  } = params

  try {
    // Check if query is in scope
    if (!isQueryInScope(query)) {
      return {
        answer: OUT_OF_SCOPE_RESPONSE,
        contextArticles: [],
        confidence: 1.0, // High confidence in out-of-scope response
        shouldEscalate: false,
        responseTimeMs: Date.now() - startTime,
        citations: [],
      }
    }

    // Step 1: Retrieve context
    const { articles, confidence } = await retrieveContext({
      query,
      maxArticles,
      similarityThreshold,
    })

    // Convert to KBArticle format for prompt building
    const kbArticles: KBArticle[] = articles.map(a => ({
      id: a.article_id,
      title: a.title,
      content: a.content,
      category: (a.metadata as { category?: string })?.category || 'General',
      similarity: a.similarity,
    }))

    // Step 2: Build augmented prompt
    const augmentedPrompt = buildRAGPrompt(query, kbArticles, conversationHistory)

    // Step 3: Generate response
    const chatResponse: ChatGenerationResponse = await generateChatResponse({
      prompt: augmentedPrompt,
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      temperature,
      maxOutputTokens: 1024,
    })

    const answer = chatResponse.text

    // Step 4: Extract citations
    const citations = extractCitations(answer)

    // Step 5: Determine if escalation should be suggested
    const shouldEscalate = shouldSuggestEscalation(
      confidence,
      conversationHistory.length
    )

    const responseTimeMs = Date.now() - startTime

    return {
      answer,
      contextArticles: articles,
      confidence,
      shouldEscalate,
      responseTimeMs,
      citations,
    }
  } catch (error) {
    console.error('RAG response generation error:', error)

    // Provide graceful fallback
    return {
      answer:
        "I'm having trouble generating a response right now. Could you rephrase your question? " +
        "If the issue persists, I recommend creating a support ticket so our IT team can assist you directly.",
      contextArticles: [],
      confidence: 0,
      shouldEscalate: true,
      responseTimeMs: Date.now() - startTime,
      citations: [],
    }
  }
}

// ============================================================================
// Streaming RAG Response
// ============================================================================

export interface StreamRAGResponseParams {
  query: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  maxArticles?: number
  similarityThreshold?: number
  temperature?: number
}

export interface StreamRAGResponseChunk {
  type: 'context' | 'content' | 'done' | 'error'
  text?: string
  contextArticles?: RAGContext[]
  confidence?: number
  shouldEscalate?: boolean
  responseTimeMs?: number
  citations?: string[]
  error?: string
}

/**
 * Generate a streaming RAG response
 *
 * Yields chunks as they are generated for real-time display.
 *
 * @param params - Generation parameters
 * @returns Async iterable of response chunks
 */
export async function* streamRAGResponse(
  params: StreamRAGResponseParams
): AsyncGenerator<StreamRAGResponseChunk> {
  const startTime = Date.now()

  const {
    query,
    conversationHistory = [],
    maxArticles,
    similarityThreshold,
    temperature = 0.7,
  } = params

  try {
    // Check if query is in scope
    if (!isQueryInScope(query)) {
      yield {
        type: 'content',
        text: OUT_OF_SCOPE_RESPONSE,
      }

      yield {
        type: 'done',
        responseTimeMs: Date.now() - startTime,
        citations: [],
      }

      return
    }

    // Step 1: Retrieve context
    const { articles, confidence } = await retrieveContext({
      query,
      maxArticles,
      similarityThreshold,
    })

    // Yield context information
    yield {
      type: 'context',
      contextArticles: articles,
      confidence,
    }

    // Convert to KBArticle format
    const kbArticles: KBArticle[] = articles.map(a => ({
      id: a.article_id,
      title: a.title,
      content: a.content,
      category: (a.metadata as { category?: string })?.category || 'General',
      similarity: a.similarity,
    }))

    // Step 2: Build augmented prompt
    const augmentedPrompt = buildRAGPrompt(query, kbArticles, conversationHistory)

    // Step 3: Generate streaming response
    const chatStream = await generateChatStreamResponse({
      prompt: augmentedPrompt,
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      temperature,
      maxOutputTokens: 1024,
    })

    let fullResponse = ''

    // Yield content chunks
    for await (const chunk of chatStream) {
      if (chunk.text) {
        fullResponse += chunk.text
        yield {
          type: 'content',
          text: chunk.text,
        }
      }
    }

    // Step 4: Extract citations from full response
    const citations = extractCitations(fullResponse)

    // Step 5: Determine escalation
    const shouldEscalate = shouldSuggestEscalation(
      confidence,
      conversationHistory.length
    )

    // Yield completion
    yield {
      type: 'done',
      responseTimeMs: Date.now() - startTime,
      citations,
      shouldEscalate,
    }
  } catch (error) {
    console.error('Streaming RAG error:', error)

    yield {
      type: 'error',
      error:
        "I'm having trouble generating a response. Please try again or create a support ticket.",
    }
  }
}

// ============================================================================
// Citation Extraction
// ============================================================================

/**
 * Extract KB article citations from response text
 *
 * Finds all instances of [Article Title] format in the response.
 *
 * @param responseText - The AI response text
 * @returns Array of cited article titles
 */
export function extractCitations(responseText: string): string[] {
  const citationRegex = /\[([^\]]+)\]/g
  const citations: string[] = []

  let match
  while ((match = citationRegex.exec(responseText)) !== null) {
    const citation = match[1].trim()

    // Avoid including markdown links or other bracket content
    if (
      citation.length > 3 &&
      citation.length < 100 &&
      !citation.includes('http')
    ) {
      citations.push(citation)
    }
  }

  // Remove duplicates
  return Array.from(new Set(citations))
}

/**
 * Match citation titles to article IDs
 *
 * Maps extracted citation titles back to the KB article IDs.
 *
 * @param citations - Array of citation titles
 * @param articles - Array of context articles
 * @returns Map of citation to article ID
 */
export function matchCitationsToArticles(
  citations: string[],
  articles: RAGContext[]
): Map<string, string> {
  const citationMap = new Map<string, string>()

  for (const citation of citations) {
    const matchedArticle = articles.find(article =>
      article.title.toLowerCase().includes(citation.toLowerCase()) ||
      citation.toLowerCase().includes(article.title.toLowerCase())
    )

    if (matchedArticle) {
      citationMap.set(citation, matchedArticle.article_id)
    }
  }

  return citationMap
}

// ============================================================================
// Conversation History Formatting
// ============================================================================

/**
 * Format conversation history for Gemini API
 *
 * Converts chat messages to Gemini's expected format.
 *
 * @param messages - Array of chat messages
 * @returns Formatted conversation history
 */
export function formatConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : ('model' as const),
    parts: [{ text: msg.content }],
  }))
}

/**
 * Trim conversation history to fit token limits
 *
 * Keeps the most recent messages within the context window.
 *
 * @param messages - Array of chat messages
 * @param maxMessages - Maximum number of messages to keep
 * @returns Trimmed message array
 */
export function trimConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxMessages = 10
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (messages.length <= maxMessages) {
    return messages
  }

  // Keep the most recent messages
  return messages.slice(-maxMessages)
}
