/**
 * RAG (Retrieval-Augmented Generation) Utilities
 * 
 * Functions for semantic search over:
 * - Knowledge base articles
 * - AI event embeddings
 * - Past tickets
 * 
 * SERVER-ONLY
 */

'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { generateEmbedding } from '@/lib/ai/client'
import type {
  RAGSource,
  RAGContext,
  AiEmbeddingSearchResult,
} from '@/lib/types/ai-events'
import type { Ticket, TicketComment } from '@/lib/types/tickets'
import type { AiEvent } from '@/lib/types/ai-events'

const DEFAULT_MATCH_THRESHOLD = 0.7
const DEFAULT_MATCH_COUNT = 10

export async function searchKnowledgeBase(
  query: string,
  matchThreshold: number = DEFAULT_MATCH_THRESHOLD,
  matchCount: number = DEFAULT_MATCH_COUNT
): Promise<RAGContext> {
  const startTime = Date.now()

  try {
    // 1. Generate query embedding
    const embedding = await generateEmbedding(query, {
      taskType: 'RETRIEVAL_QUERY',
    })

    // 2. Search using vector similarity
    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('match_kb_articles', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    })

    if (error) {
      console.error('[searchKnowledgeBase] Error:', error)
      throw error
    }

    interface KBArticleResult {
      id: string
      title: string
      content: string
      similarity: number
      category?: string
      subcategory?: string
      tags?: string[]
      view_count?: number
    }
    
    const sources: RAGSource[] = (data || []).map((article: KBArticleResult) => ({
      id: article.id,
      type: 'kb_article' as const,
      title: article.title,
      content: article.content,
      similarity: article.similarity,
      metadata: {
        category: article.category,
        subcategory: article.subcategory,
        tags: article.tags,
        view_count: article.view_count,
      },
    }))

    return {
      sources,
      query,
      totalFound: sources.length,
      searchTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[searchKnowledgeBase] Exception:', error)
    return {
      sources: [],
      query,
      totalFound: 0,
      searchTimeMs: Date.now() - startTime,
    }
  }
}

export async function searchAIEventEmbeddings(
  query: string,
  matchThreshold: number = DEFAULT_MATCH_THRESHOLD,
  matchCount: number = DEFAULT_MATCH_COUNT,
  filterTypes?: string[]
): Promise<AiEmbeddingSearchResult[]> {
  try {
    const embedding = await generateEmbedding(query, {
      taskType: 'RETRIEVAL_QUERY',
    })

    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('match_ai_event_embeddings', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_types: filterTypes || null,
    })

    if (error) {
      console.error('[searchAIEventEmbeddings] Error:', error)
      return []
    }

    return (data || []) as AiEmbeddingSearchResult[]
  } catch (error) {
    console.error('[searchAIEventEmbeddings] Exception:', error)
    return []
  }
}

export async function searchAllSources(
  query: string,
  options: {
    matchThreshold?: number
    matchCount?: number
    includeKB?: boolean
    includeEvents?: boolean
    eventTypes?: string[]
  } = {}
): Promise<RAGContext> {
  const {
    matchThreshold = DEFAULT_MATCH_THRESHOLD,
    matchCount = DEFAULT_MATCH_COUNT,
    includeKB = true,
    includeEvents = true,
    eventTypes,
  } = options

  const startTime = Date.now()

  try {
    const sources: RAGSource[] = []

    if (includeKB) {
      const kbResults = await searchKnowledgeBase(query, matchThreshold, matchCount)
      sources.push(...kbResults.sources)
    }

    if (includeEvents) {
      const eventResults = await searchAIEventEmbeddings(
        query,
        matchThreshold,
        matchCount,
        eventTypes
      )

      const eventSources: RAGSource[] = eventResults.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: `${event.event_type} - ${new Date(event.created_at).toLocaleDateString()}`,
        content: event.content_summary,
        similarity: event.similarity,
        metadata: {
          event_type: event.event_type,
          sensitivity: event.sensitivity,
          user_role: event.user_role,
          ...event.metadata,
        },
      }))

      sources.push(...eventSources)
    }

    sources.sort((a, b) => b.similarity - a.similarity)

    const limitedSources = sources.slice(0, matchCount)

    return {
      sources: limitedSources,
      query,
      totalFound: limitedSources.length,
      searchTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[searchAllSources] Exception:', error)
    return {
      sources: [],
      query,
      totalFound: 0,
      searchTimeMs: Date.now() - startTime,
    }
  }
}

export function buildContextString(
  sources: RAGSource[],
  maxLength: number = 4000
): string {
  if (sources.length === 0) {
    return 'No relevant context found.'
  }

  let context = 'Relevant Information:\n\n'
  let currentLength = context.length

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]
    const sourceText = `[${i + 1}] ${source.title || source.type}\n${source.content}\n\n`

    if (currentLength + sourceText.length > maxLength) {
      break
    }

    context += sourceText
    currentLength += sourceText.length
  }

  return context
}

export async function getTicketContext(ticketId: string): Promise<{
  ticket: Ticket | null
  comments: TicketComment[]
  events: AiEvent[]
}> {
  try {
    const supabase = createServiceClient()

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    const { data: events } = await supabase
      .from('ai_events')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    return {
      ticket: ticket || null,
      comments: comments || [],
      events: events || [],
    }
  } catch (error) {
    console.error('[getTicketContext] Exception:', error)
    return {
      ticket: null,
      comments: [],
      events: [],
    }
  }
}
