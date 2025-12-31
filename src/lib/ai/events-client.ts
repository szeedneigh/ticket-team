/**
 * Client-Side AI Event Logging Utilities
 * 
 * Batches events on the client and sends them to the server periodically
 * to reduce network overhead and improve performance.
 * 
 * Safe to use in Client Components.
 */

import type { AiEventType, AiEventSurface, AiEventSensitivity, ClientAiEvent } from '@/lib/types/ai-events'

// ============================================================================
// Configuration
// ============================================================================

const BATCH_SIZE = 10
const BATCH_INTERVAL_MS = 5000 // 5 seconds
const MAX_QUEUE_SIZE = 100

// ============================================================================
// Event Queue
// ============================================================================

let eventQueue: ClientAiEvent[] = []
let batchTimer: NodeJS.Timeout | null = null

/**
 * Flush the event queue to the server
 */
async function flushEventQueue(): Promise<void> {
  if (eventQueue.length === 0) return

  const eventsToSend = [...eventQueue]
  eventQueue = []

  try {
    const response = await fetch('/api/ai/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: eventsToSend }),
    })

    if (!response.ok) {
      console.error('[flushEventQueue] Server error:', response.status)
      // Re-add events to queue if server error (up to max size)
      eventQueue.unshift(...eventsToSend.slice(0, MAX_QUEUE_SIZE - eventQueue.length))
    }
  } catch (error) {
    console.error('[flushEventQueue] Network error:', error)
    // Re-add events to queue if network error (up to max size)
    eventQueue.unshift(...eventsToSend.slice(0, MAX_QUEUE_SIZE - eventQueue.length))
  }
}

/**
 * Start the batch timer
 */
function startBatchTimer(): void {
  if (batchTimer) return

  batchTimer = setInterval(() => {
    flushEventQueue()
  }, BATCH_INTERVAL_MS)
}

/**
 * Add event to queue and trigger flush if needed
 */
function queueEvent(event: ClientAiEvent): void {
  // Prevent queue overflow
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    console.warn('[queueEvent] Queue full, flushing...')
    flushEventQueue()
  }

  eventQueue.push(event)

  // Flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEventQueue()
  }

  // Start timer if not already running
  startBatchTimer()
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log an AI event from the client
 * 
 * @param eventType - Type of event
 * @param surface - UI surface where event occurred
 * @param content - Event content
 * @param sensitivity - Event sensitivity level
 * @param metadata - Additional metadata
 */
export function logClientEvent(
  eventType: AiEventType,
  surface: AiEventSurface,
  content: string,
  sensitivity: AiEventSensitivity = 'internal',
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType,
    surface,
    content,
    sensitivity,
    metadata,
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Log an assistant query event
 * 
 * @param query - User query
 * @param surface - UI surface
 * @param sessionId - Optional session ID
 * @param metadata - Additional metadata
 */
export function logAssistantQuery(
  query: string,
  surface: AiEventSurface,
  sessionId?: string,
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType: 'assistant_query',
    surface,
    content: query,
    sensitivity: 'internal',
    sessionId,
    metadata,
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Log an assistant response event
 * 
 * @param response - Assistant response
 * @param surface - UI surface
 * @param parentEventId - Parent query event ID
 * @param metadata - Additional metadata (e.g., sources)
 */
export function logAssistantResponse(
  response: string,
  surface: AiEventSurface,
  parentEventId?: string,
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType: 'assistant_response',
    surface,
    content: response,
    sensitivity: 'internal',
    metadata: {
      ...metadata,
      parent_event_id: parentEventId,
    },
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Log a search query event
 * 
 * @param query - Search query
 * @param surface - UI surface
 * @param metadata - Additional metadata
 */
export function logSearchQuery(
  query: string,
  surface: AiEventSurface,
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType: 'search_query',
    surface,
    content: query,
    sensitivity: 'internal',
    metadata,
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Log a feedback event
 * 
 * @param score - Feedback score (-1, 0, 1)
 * @param text - Feedback text
 * @param surface - UI surface
 * @param parentEventId - Event being given feedback on
 * @param metadata - Additional metadata
 */
export function logFeedback(
  score: number,
  text: string,
  surface: AiEventSurface,
  parentEventId?: string,
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType: 'feedback_given',
    surface,
    content: text,
    sensitivity: 'internal',
    metadata: {
      ...metadata,
      score,
      parent_event_id: parentEventId,
    },
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Log a KB article view event
 * 
 * @param articleId - Article ID
 * @param articleTitle - Article title
 * @param surface - UI surface
 * @param metadata - Additional metadata
 */
export function logKBView(
  articleId: string,
  articleTitle: string,
  surface: AiEventSurface,
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType: 'kb_viewed',
    surface,
    content: `Viewed: ${articleTitle}`,
    sensitivity: 'public',
    articleId,
    metadata,
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Log a KB article vote event
 * 
 * @param articleId - Article ID
 * @param isHelpful - Whether the article was helpful
 * @param surface - UI surface
 * @param metadata - Additional metadata
 */
export function logKBVote(
  articleId: string,
  isHelpful: boolean,
  surface: AiEventSurface,
  metadata?: Record<string, unknown>
): void {
  const event: ClientAiEvent = {
    eventType: 'kb_voted',
    surface,
    content: isHelpful ? 'Voted helpful' : 'Voted not helpful',
    sensitivity: 'internal',
    articleId,
    metadata: {
      ...metadata,
      is_helpful: isHelpful,
    },
    timestamp: Date.now(),
  }

  queueEvent(event)
}

/**
 * Manually flush the event queue (useful for unmount or navigation)
 */
export function flushEvents(): Promise<void> {
  return flushEventQueue()
}

/**
 * Clear the event queue (useful for cleanup)
 */
export function clearEventQueue(): void {
  eventQueue = []
  if (batchTimer) {
    clearInterval(batchTimer)
    batchTimer = null
  }
}

// ============================================================================
// Cleanup on page unload
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushEventQueue()
  })
}







