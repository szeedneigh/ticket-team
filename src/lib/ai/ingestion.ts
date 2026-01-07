/**
 * AI Event Ingestion and Enrichment Pipeline
 * 
 * Processes unprocessed AI events by:
 * - Generating embeddings (768-dim via Gemini)
 * - Extracting keywords
 * - Storing optimized embeddings for RAG retrieval
 * 
 * SERVER-ONLY
 */

'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { generateEmbedding } from '@/lib/ai/client'
import { getUnprocessedEvents, markEventProcessed } from '@/lib/ai/events'
import type { AiEvent } from '@/lib/types/ai-events'

const BATCH_SIZE = 50
const KEYWORD_EXTRACTION_REGEX = /\b[A-Z][a-z]+\b|\b[a-z]{4,}\b/g

function extractKeywords(text: string): string[] {
  const words = text.match(KEYWORD_EXTRACTION_REGEX) || []
  const uniqueKeywords = [...new Set(words.map(w => w.toLowerCase()))]
  
  const stopWords = new Set([
    'the', 'this', 'that', 'with', 'from', 'have', 'been',
    'were', 'they', 'your', 'what', 'when', 'where', 'which',
    'about', 'would', 'could', 'should', 'there', 'their',
  ])
  
  return uniqueKeywords
    .filter(word => !stopWords.has(word) && word.length >= 4)
    .slice(0, 20)
}

async function processEvent(event: AiEvent): Promise<boolean> {
  try {
    const embedding = await generateEmbedding(event.content, {
      taskType: 'RETRIEVAL_DOCUMENT',
    })

    const keywords = extractKeywords(event.content)

    await markEventProcessed(event.id, embedding, keywords)

    const supabase = createServiceClient()
    
    const contentSummary = event.content.length > 500
      ? event.content.substring(0, 497) + '...'
      : event.content

    await supabase
      .from('ai_event_embeddings')
      .insert({
        event_id: event.id,
        embedding: JSON.stringify(embedding),
        content_summary: contentSummary,
        event_type: event.event_type,
        sensitivity: event.sensitivity,
        user_role: event.user_role,
        metadata: event.metadata || {},
      })

    return true
  } catch (error) {
    console.error(`[processEvent] Error processing event ${event.id}:`, error)
    
    try {
      const supabase = createServiceClient()
      await supabase
        .from('ai_events')
        .update({
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', event.id)
    } catch (updateError) {
      console.error('[processEvent] Failed to mark event with error:', updateError)
    }
    
    return false
  }
}

export async function processUnprocessedEvents(
  batchSize: number = BATCH_SIZE
): Promise<{
  processed: number
  failed: number
  total: number
}> {
  try {
    const events = await getUnprocessedEvents(batchSize)

    if (events.length === 0) {
      return {
        processed: 0,
        failed: 0,
        total: 0,
      }
    }

    let processed = 0
    let failed = 0

    for (const event of events) {
      const success = await processEvent(event)
      if (success) {
        processed++
      } else {
        failed++
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return {
      processed,
      failed,
      total: events.length,
    }
  } catch (error) {
    console.error('[processUnprocessedEvents] Error:', error)
    throw error
  }
}

export async function processAllPendingEvents(): Promise<{
  totalProcessed: number
  totalFailed: number
  totalBatches: number
}> {
  let totalProcessed = 0
  let totalFailed = 0
  let totalBatches = 0

  try {
    while (true) {
      const result = await processUnprocessedEvents(BATCH_SIZE)
      
      if (result.total === 0) {
        break
      }

      totalProcessed += result.processed
      totalFailed += result.failed
      totalBatches++

      if (totalBatches >= 20) {
        console.warn('[processAllPendingEvents] Reached batch limit, stopping')
        break
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return {
      totalProcessed,
      totalFailed,
      totalBatches,
    }
  } catch (error) {
    console.error('[processAllPendingEvents] Error:', error)
    throw error
  }
}

export async function getIngestionStats(): Promise<{
  totalEvents: number
  processedEvents: number
  unprocessedEvents: number
  eventEmbeddings: number
  processingRate: number
}> {
  try {
    const supabase = createServiceClient()

    const { count: totalEvents } = await supabase
      .from('ai_events')
      .select('*', { count: 'exact', head: true })

    const { count: processedEvents } = await supabase
      .from('ai_events')
      .select('*', { count: 'exact', head: true })
      .not('processed_at', 'is', null)

    const { count: unprocessedEvents } = await supabase
      .from('ai_events')
      .select('*', { count: 'exact', head: true })
      .is('processed_at', null)

    const { count: eventEmbeddings } = await supabase
      .from('ai_event_embeddings')
      .select('*', { count: 'exact', head: true })

    const processingRate = (totalEvents || 0) > 0
      ? ((processedEvents || 0) / (totalEvents || 1)) * 100
      : 0

    return {
      totalEvents: totalEvents || 0,
      processedEvents: processedEvents || 0,
      unprocessedEvents: unprocessedEvents || 0,
      eventEmbeddings: eventEmbeddings || 0,
      processingRate: Math.round(processingRate * 100) / 100,
    }
  } catch (error) {
    console.error('[getIngestionStats] Error:', error)
    throw error
  }
}

