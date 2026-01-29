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

const AI_MODELS = {
  // Note: @google/genai SDK uses 'gemini-embedding-001' for embeddings
  // Supports up to 3072-dim with Matryoshka scaling (we use 768 to match DB schema)
  // Supports RETRIEVAL_QUERY/RETRIEVAL_DOCUMENT task types
  EMBEDDING: 'gemini-embedding-001',
  CHAT: 'gemini-2.5-flash',  // Verified working with free tier
  CHAT_PRO: 'gemini-2.5-pro',
  CHAT_FALLBACK: 'gemini-2.0-flash',  // Fallback (may have quota limits)
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

let aiClient: GoogleGenAI | null = null

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

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, error: Error) => void
  /** If false, do not retry (e.g. for 429 quota exhausted - daily limit won't reset) */
  shouldRetry?: (error: Error) => boolean
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    initialDelay = RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelay = RETRY_CONFIG.MAX_DELAY_MS,
    onRetry,
    shouldRetry: shouldRetryFn = () => true,
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        break
      }

      // Don't retry if shouldRetry returns false (e.g. 429 quota exhausted)
      if (!shouldRetryFn(lastError)) {
        break
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)

      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Unknown error during retry')
}

export function isQuotaExhaustedError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('429') ||
      message.includes('quota') ||
      message.includes('resource_exhausted') ||
      message.includes('rate limit')
    )
  }
  return false
}

/**
 * Don't retry on 429 (quota exhausted) - daily limits reset at midnight,
 * so retries within the same day always fail.
 */
function shouldRetryOnQuotaError(error: Error): boolean {
  return !isQuotaExhaustedError(error)
}

export function extractRetryDelay(error: unknown): number | null {
  if (error instanceof Error) {
    const retryDelayMatch = error.message.match(/retry(?:Delay)?[":]?\s*["']?(\d+(?:\.\d+)?)/i)
    if (retryDelayMatch) {
      return Math.ceil(parseFloat(retryDelayMatch[1]))
    }
    const waitMatch = error.message.match(/wait\s+(\d+)\s*second/i)
    if (waitMatch) {
      return parseInt(waitMatch[1], 10)
    }
  }
  return null
}

function normalizeAIError(error: unknown, retrySeconds?: number | null): Error {
  if (error instanceof Error) {
    if (isQuotaExhaustedError(error)) {
      const delay = retrySeconds ?? extractRetryDelay(error)
      if (delay && delay > 0) {
        return new Error(
          `Our AI assistant is experiencing high demand. Please try again in ${delay} seconds.`
        )
      }
      return new Error(
        'Our AI assistant is experiencing high demand. Please try again in a moment.'
      )
    }

    if (error.message.includes('safety') || error.message.includes('blocked')) {
      return new Error(
        "I can't provide an answer to that. Please create a ticket for assistance."
      )
    }

    if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      return new Error(
        'Connection lost. Please check your internet and try again.'
      )
    }

    if (error.message.includes('model') && error.message.includes('not found')) {
      return new Error(
        'AI model is temporarily unavailable. Please try again later.'
      )
    }

    return error
  }

  return new Error('An unexpected error occurred with the AI assistant.')
}

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

    const config = {
      systemInstruction,
      temperature,
      maxOutputTokens,
      topP,
      topK,
    }

    // Try primary model first, then fallback on quota exhaustion (different model = separate quota)
    const modelsToTry = [AI_MODELS.CHAT, AI_MODELS.CHAT_FALLBACK]
    let lastError: Error | null = null

    for (const model of modelsToTry) {
      try {
        const response = await withRetry(
          async () => {
            return await ai.models.generateContent({
              model,
              contents,
              config,
            })
          },
          {
            onRetry: (attempt, error) => {
              if (shouldRetryOnQuotaError(error)) {
                console.warn(`Chat generation retry ${attempt}/3 (${model}):`, error.message)
              }
            },
            shouldRetry: shouldRetryOnQuotaError,
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
        lastError = error as Error

        // If quota exhausted and we have a fallback model, try it (separate daily quota)
        if (isQuotaExhaustedError(error) && model !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`Model ${model} quota exhausted, trying fallback model...`)
          continue
        }

        throw error
      }
    }

    throw lastError || new Error('All models failed')
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

  const ai = getAIClient()

  // Build contents array with conversation history
  const contents = [
    ...conversationHistory,
    {
      role: 'user' as const,
      parts: [{ text: prompt }],
    },
  ]

  const config = {
    systemInstruction,
    temperature,
    maxOutputTokens,
    topP,
    topK,
  }

  // Try primary model first, then fallback on quota exhaustion
  const modelsToTry = [AI_MODELS.CHAT, AI_MODELS.CHAT_FALLBACK]
  let lastError: Error | null = null

  for (const model of modelsToTry) {
    try {
      const response = await withRetry(
        async () => {
          return await ai.models.generateContentStream({
            model,
            contents,
            config,
          })
        },
        {
          onRetry: (attempt, error) => {
            if (shouldRetryOnQuotaError(error)) {
              console.warn(`Stream generation retry ${attempt}/3 (${model}):`, error.message)
            }
          },
          shouldRetry: shouldRetryOnQuotaError,
        }
      )

      // Log which model was used (helpful for monitoring)
      if (model !== AI_MODELS.CHAT) {
        console.info(`Using fallback model: ${model}`)
      }

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
      lastError = error as Error

      // If it's a quota exhaustion error and we have a fallback, try the next model
      if (isQuotaExhaustedError(error) && model !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`Model ${model} quota exhausted, trying fallback model...`)
        continue
      }

      // For non-quota errors or last model, throw the normalized error
      console.error('Stream generation error:', error)
      throw normalizeAIError(error)
    }
  }

  // Should not reach here, but just in case
  throw normalizeAIError(lastError || new Error('All models failed'))
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
