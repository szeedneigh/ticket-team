import type { AiEventType, AiEventSurface, AiEventSensitivity, ClientAiEvent } from '@/lib/types/ai-events'

const BATCH_SIZE = 10
const BATCH_INTERVAL_MS = 5000 // 5 seconds
const MAX_QUEUE_SIZE = 100

let eventQueue: ClientAiEvent[] = []
let batchTimer: NodeJS.Timeout | null = null

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
      eventQueue.unshift(...eventsToSend.slice(0, MAX_QUEUE_SIZE - eventQueue.length))
    }
  } catch (error) {
    console.error('[flushEventQueue] Network error:', error)
    eventQueue.unshift(...eventsToSend.slice(0, MAX_QUEUE_SIZE - eventQueue.length))
  }
}

function startBatchTimer(): void {
  if (batchTimer) return

  batchTimer = setInterval(() => {
    flushEventQueue()
  }, BATCH_INTERVAL_MS)
}

function queueEvent(event: ClientAiEvent): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    console.warn('[queueEvent] Queue full, flushing...')
    flushEventQueue()
  }

  eventQueue.push(event)

  if (eventQueue.length >= BATCH_SIZE) {
    flushEventQueue()
  }

  startBatchTimer()
}

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

export function flushEvents(): Promise<void> {
  return flushEventQueue()
}

export function clearEventQueue(): void {
  eventQueue = []
  if (batchTimer) {
    clearInterval(batchTimer)
    batchTimer = null
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushEventQueue()
  })
}










