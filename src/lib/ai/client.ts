/**
 * Centralized Google GenAI Client
 *
 * This module provides a singleton instance of the GoogleGenAI client
 * and helper functions for embeddings, chat generation, and streaming.
 *
 * CRITICAL: This file is SERVER-ONLY. Never import in client components.
 *
 * @module lib/ai/client
 */

import { GoogleGenAI } from '@google/genai'
import { serverEnv } from '@/lib/env/server'
import type { EmbeddingRequest } from '@/lib/types/ai'

// ============================================================================
// Configuration
// ============================================================================

const AI_MODELS = {
  EMBEDDING: 'text-embedding-004',
  CHAT: 'gemini-2.0-flash-exp',
  CHAT_PRO: 'gemini-2.0-flash',
} as const

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 4000,
} as const

const EMBEDDING_CONFIG = {
  OUTPUT_DIMENSIONALITY: 768,
  TASK_TYPE_QUERY: 'RETRIEVAL_QUERY' as const,
  TASK_TYPE_DOCUMENT: 'RETRIEVAL_DOCUMENT' as const,
} as const

// ============================================================================
// Client Initialization
// ============================================================================

let aiClient: GoogleGenAI | null = null

/**
 * Get or create the GoogleGenAI client instance
 *
 * @throws {Error} If GEMINI_API_KEY is not configured
 */
function getAIClient(): GoogleGenAI {
  if (aiClient) {
    return aiClient
  }

  const apiKey = serverEnv.gemini.apiKey

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set it in your environment variables.\n' +
      'See docs/01-overview/setup-guide.md for configuration instructions.'
    )
  }

  aiClient = new GoogleGenAI({ apiKey })
  return aiClient
}

// ============================================================================
// Error Handling & Retry Logic
// ============================================================================

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Execute a function with exponential backoff retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    initialDelay = RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelay = RETRY_CONFIG.MAX_DELAY_MS,
    onRetry,
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate exponential backoff delay
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Unknown error during retry')
}

/**
 * Normalize AI API errors to user-friendly messages
 */
function normalizeAIError(error: unknown): Error {
  if (error instanceof Error) {
    // API quota exceeded
    if (error.message.includes('quota') || error.message.includes('429')) {
      return new Error(
        'Our AI assistant is experiencing high demand. Please try again in a moment.'
      )
    }

    // Safety filter triggered
    if (error.message.includes('safety') || error.message.includes('blocked')) {
      return new Error(
        "I can't provide an answer to that. Please create a ticket for assistance."
      )
    }

    // Network errors
    if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      return new Error(
        'Connection lost. Please check your internet and try again.'
      )
    }

    // Model not found
    if (error.message.includes('model') && error.message.includes('not found')) {
      return new Error(
        'AI model is temporarily unavailable. Please try again later.'
      )
    }

    return error
  }

  return new Error('An unexpected error occurred with the AI assistant.')
}

// ============================================================================
// Embedding Generation
// ============================================================================

/**
 * Generate embeddings for a text string
 *
 * @param text - The text to generate embeddings for
 * @param options - Optional configuration for the embedding request
 * @returns The embedding vector (768 dimensions)
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding('How do I reset my password?', {
 *   taskType: 'RETRIEVAL_QUERY'
 * })
 * ```
 */
export async function generateEmbedding(
  text: string,
  options: Omit<EmbeddingRequest, 'text'> = {}
): Promise<number[]> {
  const {
    model = AI_MODELS.EMBEDDING,
    taskType = EMBEDDING_CONFIG.TASK_TYPE_QUERY,
    outputDimensionality = EMBEDDING_CONFIG.OUTPUT_DIMENSIONALITY,
  } = options

  try {
    const ai = getAIClient()

    const response = await withRetry(
      async () => {
        return await ai.models.embedContent({
          model,
          contents: text,
          config: {
            taskType,
            outputDimensionality,
          },
        })
      },
      {
        onRetry: (attempt, error) => {
          console.warn(`Embedding generation retry ${attempt}/3:`, error.message)
        },
      }
    )

    const embedding = response.embeddings?.[0]?.values

    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding received from API')
    }

    return embedding
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw normalizeAIError(error)
  }
}

/**
 * Generate embeddings for a document (optimized for storage)
 *
 * @param text - The document text to embed
 * @returns The embedding vector (768 dimensions)
 */
export async function generateDocumentEmbedding(text: string): Promise<number[]> {
  return generateEmbedding(text, {
    taskType: EMBEDDING_CONFIG.TASK_TYPE_DOCUMENT,
  })
}

// ============================================================================
// Chat Generation (Non-Streaming)
// ============================================================================

export interface ChatGenerationParams {
  prompt: string
  systemInstruction?: string
  conversationHistory?: Array<{
    role: 'user' | 'model'
    parts: Array<{ text: string }>
  }>
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  topK?: number
}

export interface ChatGenerationResponse {
  text: string
  finishReason?: string
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}

/**
 * Generate a complete chat response (non-streaming)
 *
 * @param params - Chat generation parameters
 * @returns The generated response
 *
 * @example
 * ```typescript
 * const response = await generateChatResponse({
 *   prompt: 'How do I reset my password?',
 *   systemInstruction: 'You are an IT support assistant.',
 *   temperature: 0.7
 * })
 * console.log(response.text)
 * ```
 */
export async function generateChatResponse(
  params: ChatGenerationParams
): Promise<ChatGenerationResponse> {
  const {
    prompt,
    systemInstruction,
    conversationHistory = [],
    temperature = 0.7,
    maxOutputTokens = 1024,
    topP = 0.9,
    topK = 40,
  } = params

  try {
    const ai = getAIClient()

    // Build contents array with conversation history
    const contents = [
      ...conversationHistory,
      {
        role: 'user' as const,
        parts: [{ text: prompt }],
      },
    ]

    const response = await withRetry(
      async () => {
        return await ai.models.generateContent({
          model: AI_MODELS.CHAT,
          contents,
          config: {
            systemInstruction,
            temperature,
            maxOutputTokens,
            topP,
            topK,
          },
        })
      },
      {
        onRetry: (attempt, error) => {
          console.warn(`Chat generation retry ${attempt}/3:`, error.message)
        },
      }
    )

    const text = response.text || ''
    const finishReason = response.candidates?.[0]?.finishReason
    const usageMetadata = response.usageMetadata

    return {
      text,
      finishReason,
      usageMetadata,
    }
  } catch (error) {
    console.error('Chat generation error:', error)
    throw normalizeAIError(error)
  }
}

// ============================================================================
// Chat Generation (Streaming)
// ============================================================================

export interface ChatStreamChunk {
  text: string
  finishReason?: string
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}

/**
 * Generate a streaming chat response
 *
 * @param params - Chat generation parameters
 * @returns An async iterable of response chunks
 *
 * @example
 * ```typescript
 * const stream = await generateChatStreamResponse({
 *   prompt: 'Explain how VPN works',
 *   systemInstruction: 'You are an IT support assistant.'
 * })
 *
 * for await (const chunk of stream) {
 *   console.log(chunk.text)
 * }
 * ```
 */
export async function generateChatStreamResponse(
  params: ChatGenerationParams
): Promise<AsyncIterable<ChatStreamChunk>> {
  const {
    prompt,
    systemInstruction,
    conversationHistory = [],
    temperature = 0.7,
    maxOutputTokens = 1024,
    topP = 0.9,
    topK = 40,
  } = params

  try {
    const ai = getAIClient()

    // Build contents array with conversation history
    const contents = [
      ...conversationHistory,
      {
        role: 'user' as const,
        parts: [{ text: prompt }],
      },
    ]

    const response = await withRetry(
      async () => {
        return await ai.models.generateContentStream({
          model: AI_MODELS.CHAT,
          contents,
          config: {
            systemInstruction,
            temperature,
            maxOutputTokens,
            topP,
            topK,
          },
        })
      },
      {
        onRetry: (attempt, error) => {
          console.warn(`Stream generation retry ${attempt}/3:`, error.message)
        },
      }
    )

    // Return async generator that yields chunks
    return (async function* () {
      try {
        for await (const chunk of response) {
          yield {
            text: chunk.text || '',
            finishReason: chunk.candidates?.[0]?.finishReason,
            usageMetadata: chunk.usageMetadata,
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error)
        throw normalizeAIError(error)
      }
    })()
  } catch (error) {
    console.error('Stream generation error:', error)
    throw normalizeAIError(error)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if the AI client is configured and ready to use
 *
 * @returns True if the client is configured, false otherwise
 */
export function isAIConfigured(): boolean {
  return Boolean(serverEnv.gemini.apiKey)
}

/**
 * Get available AI models
 *
 * @returns Object containing model identifiers
 */
export function getAvailableModels() {
  return AI_MODELS
}
