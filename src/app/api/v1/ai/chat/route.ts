/**
 * Chat Streaming API Route
 *
 * POST /api/v1/ai/chat
 *
 * Handles AI chat requests with Server-Sent Events (SSE) streaming:
 * 1. Authenticate user
 * 2. Validate input
 * 3. Generate embedding for user message
 * 4. Retrieve KB articles via semantic search
 * 5. Build prompt with context + conversation history
 * 6. Stream Gemini response
 * 7. Log interaction to database
 *
 * Stream format:
 * - data: {"type": "context", "articles": [...], "confidence": 0.8}
 * - data: {"type": "content", "text": "partial response"}
 * - data: {"type": "done", "responseTime": 1234, "citations": [...]}
 * - data: {"type": "error", "error": "error message"}
 *
 * @module app/api/v1/ai/chat/route
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamRAGResponse } from '@/lib/chat/rag-service'
import { recordInteraction } from '@/lib/chat/queries'
import { isAIConfigured } from '@/lib/ai/client'

// ============================================================================
// Types
// ============================================================================

interface ChatRequestBody {
  message: string
  sessionId: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

// ============================================================================
// Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max for streaming

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Check if AI is configured
    if (!isAIConfigured()) {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: 'AI service is not configured. Please contact support.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 3. Parse and validate request body
    let body: ChatRequestBody
    try {
      body = await request.json()
    } catch (error) {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: 'Invalid request body',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { message, sessionId, conversationHistory = [] } = body

    // Validate message
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: 'Message is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (message.length > 2000) {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: 'Message is too long (max 2000 characters)',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: 'Session ID is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 4. Create streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''
          let contextArticles: Array<{
            article_id: string
            title: string
            content: string
            similarity: number
            metadata?: Record<string, unknown>
          }> = []
          let confidence = 0
          let citations: string[] = []

          // Stream RAG response
          const ragStream = streamRAGResponse({
            query: message,
            conversationHistory,
            maxArticles: 5,
            similarityThreshold: 0.7,
            temperature: 0.7,
          })

          for await (const chunk of ragStream) {
            // Send chunk to client
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))

            // Collect data for logging
            if (chunk.type === 'context') {
              contextArticles = chunk.contextArticles || []
              confidence = chunk.confidence || 0
            } else if (chunk.type === 'content' && chunk.text) {
              fullResponse += chunk.text
            } else if (chunk.type === 'done') {
              citations = chunk.citations || []
            }
          }

          // 5. Log interaction to database
          const responseTimeMs = Date.now() - startTime
          const articleIds = contextArticles.map(a => a.article_id)

          try {
            await recordInteraction({
              userId: user.id,
              sessionId,
              query: message,
              response: fullResponse,
              contextArticles: articleIds,
              responseTimeMs,
              metadata: {
                confidence,
                citations,
                model: 'gemini-2.0-flash-exp',
              },
            })
          } catch (error) {
            console.error('Failed to log interaction:', error)
            // Don't fail the request if logging fails
          }

          // Close the stream
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)

          // Send error to client
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)

    return new Response(
      JSON.stringify({
        type: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
