/**
 * AI Assistant Server Actions
 * 
 * Server actions for RAG-powered AI assistant queries.
 * Integrates semantic search with AI generation.
 */

'use server'

import { searchAllSources, buildContextString } from '@/lib/ai/retrieval'
import { generateChatResponse } from '@/lib/ai/client'
import { logAIEvent, logPrompt } from '@/lib/ai/events'
import type { RAGSource } from '@/lib/types/ai-events'

// ============================================================================
// Types
// ============================================================================

interface AssistantResponse {
  success: boolean
  response?: string
  sources?: Array<{ type: string; title?: string; id: string }>
  eventId?: string
  error?: string
}

interface QueryAssistantInput {
  query: string
  ticketId?: string
  surface?: string
  sessionId?: string
}

// ============================================================================
// Assistant Query
// ============================================================================

/**
 * Query the AI assistant with RAG-powered context
 * 
 * @param input - Query input
 * @returns Assistant response with sources
 */
export async function queryAssistant(
  input: QueryAssistantInput
): Promise<AssistantResponse> {
  const { query, ticketId, surface = 'assistant_panel', sessionId } = input

  const startTime = Date.now()

  try {
    // 1. Log query event
    const queryEventId = await logAIEvent({
      eventType: 'assistant_query',
      surface: surface as any,
      content: query,
      ticketId,
      sessionId,
      metadata: {},
    })

    // 2. Perform RAG retrieval
    const ragContext = await searchAllSources(query, {
      matchThreshold: 0.6,
      matchCount: 5,
      includeKB: true,
      includeEvents: true,
    })

    // 3. Build context string
    const contextString = buildContextString(ragContext.sources, 3000)

    // 4. Construct prompt
    const systemInstruction = `You are an IT support assistant for La Verdad Christian College (LVCC).
Your role is to help users with technical issues, account problems, and general IT support questions.

IMPORTANT GUIDELINES:
- Use the provided context to answer questions accurately
- If the context doesn't contain relevant information, say so honestly
- Cite sources when using specific information from the context
- Be helpful, professional, and concise
- For complex issues, suggest creating a support ticket

CONTEXT:
${contextString}`

    const userPrompt = `User Question: ${query}

Please provide a helpful response based on the context provided. If you reference specific information, mention which source it came from.`

    // 5. Generate AI response
    const aiResponse = await generateChatResponse({
      prompt: userPrompt,
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 1024,
    })

    const latency = Date.now() - startTime

    // 6. Log prompt/completion
    await logPrompt({
      model: 'gemini-2.5-flash',
      prompt: userPrompt,
      systemInstruction,
      temperature: 0.7,
      maxTokens: 1024,
      completion: aiResponse.text,
      finishReason: aiResponse.finishReason,
      promptTokens: aiResponse.usageMetadata?.promptTokenCount,
      completionTokens: aiResponse.usageMetadata?.candidatesTokenCount,
      totalTokens: aiResponse.usageMetadata?.totalTokenCount,
      latencyMs: latency,
      contextSources: ragContext.sources.map(s => s.id),
      retrievalQuery: query,
      retrievalCount: ragContext.sources.length,
      eventId: queryEventId || undefined,
    })

    // 7. Log response event
    const responseEventId = await logAIEvent({
      eventType: 'assistant_response',
      surface: surface as any,
      content: aiResponse.text,
      ticketId,
      sessionId,
      parentEventId: queryEventId || undefined,
      metadata: {
        sources_count: ragContext.sources.length,
        latency_ms: latency,
      },
    })

    // 8. Return response with sources
    return {
      success: true,
      response: aiResponse.text,
      sources: ragContext.sources.map(s => ({
        type: s.type,
        title: s.title,
        id: s.id,
      })),
      eventId: responseEventId || undefined,
    }
  } catch (error) {
    console.error('[queryAssistant] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query assistant',
    }
  }
}

// ============================================================================
// Auto-Suggestions
// ============================================================================

/**
 * Get auto-suggestions for a user's input
 * 
 * @param input - User input
 * @param context - Additional context
 * @returns Suggested completions
 */
export async function getAutoSuggestions(
  input: string,
  context?: string
): Promise<{ suggestions: string[] }> {
  try {
    // For now, return empty suggestions
    // Can be enhanced with RAG-based suggestions later
    return { suggestions: [] }
  } catch (error) {
    console.error('[getAutoSuggestions] Error:', error)
    return { suggestions: [] }
  }
}

