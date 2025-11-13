/**
 * Error Tracking Utilities
 *
 * Centralized error tracking and monitoring for AI chat errors.
 * Integrates with Sentry and provides structured error logging.
 *
 * @module lib/monitoring/error-tracking
 */

import * as Sentry from '@sentry/nextjs'

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorCategory {
  AI_API = 'ai_api',
  DATABASE = 'database',
  NETWORK = 'network',
  PARSING = 'parsing',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  category: ErrorCategory
  userId?: string
  sessionId?: string
  query?: string
  additionalData?: Record<string, unknown>
}

// ============================================================================
// Error Tracking Functions
// ============================================================================

/**
 * Track an error with context
 *
 * Logs to console in development, sends to Sentry in production
 */
export function trackError(error: Error, context: ErrorContext): void {
  const { category, userId, sessionId, query, additionalData } = context

  // Log to console in all environments for debugging
  console.error(`[${category}] Error:`, error.message)
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  })

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        error_category: category,
      },
      contexts: {
        chat: {
          user_id: userId,
          session_id: sessionId,
          query: query?.substring(0, 100), // Truncate for privacy
        },
      },
      extra: additionalData,
    })
  }
}

/**
 * Track AI streaming errors specifically
 */
export function trackStreamingError(
  error: Error,
  userId: string,
  sessionId: string,
  query: string,
  stage: 'embedding' | 'retrieval' | 'generation' | 'parsing'
): void {
  trackError(error, {
    category: ErrorCategory.AI_API,
    userId,
    sessionId,
    query,
    additionalData: {
      streaming_stage: stage,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Track database errors
 */
export function trackDatabaseError(
  error: Error,
  operation: string,
  userId?: string
): void {
  trackError(error, {
    category: ErrorCategory.DATABASE,
    userId,
    additionalData: {
      operation,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Track network errors
 */
export function trackNetworkError(
  error: Error,
  endpoint: string,
  userId?: string
): void {
  trackError(error, {
    category: ErrorCategory.NETWORK,
    userId,
    additionalData: {
      endpoint,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Track chunk parsing errors
 */
export function trackParsingError(
  error: Error,
  rawData: string,
  userId: string,
  sessionId: string
): void {
  trackError(error, {
    category: ErrorCategory.PARSING,
    userId,
    sessionId,
    additionalData: {
      raw_data: rawData.substring(0, 500), // Truncate to prevent huge logs
      timestamp: new Date().toISOString(),
    },
  })
}

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classify an error by examining its message and properties
 */
export function classifyError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()

  // AI API errors
  if (
    message.includes('quota') ||
    message.includes('429') ||
    message.includes('gemini') ||
    message.includes('model') ||
    message.includes('embedding')
  ) {
    return ErrorCategory.AI_API
  }

  // Database errors
  if (
    message.includes('supabase') ||
    message.includes('postgres') ||
    message.includes('database') ||
    message.includes('rpc') ||
    message.includes('query')
  ) {
    return ErrorCategory.DATABASE
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('enotfound') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('http error')
  ) {
    return ErrorCategory.NETWORK
  }

  // Parsing errors
  if (
    message.includes('parse') ||
    message.includes('json') ||
    message.includes('invalid response') ||
    error instanceof SyntaxError
  ) {
    return ErrorCategory.PARSING
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const category = classifyError(error)
  const message = error.message.toLowerCase()

  // Network errors are generally retryable
  if (category === ErrorCategory.NETWORK) {
    return true
  }

  // Rate limit errors are retryable after delay
  if (message.includes('quota') || message.includes('429')) {
    return true
  }

  // Temporary service issues
  if (message.includes('temporarily') || message.includes('try again')) {
    return true
  }

  return false
}

// ============================================================================
// Error Statistics (for debugging)
// ============================================================================

interface ErrorStats {
  count: number
  lastOccurred: Date
  category: ErrorCategory
}

const errorStats = new Map<string, ErrorStats>()

/**
 * Record error occurrence for statistics
 */
export function recordErrorOccurrence(error: Error, context: ErrorContext): void {
  const key = `${context.category}:${error.message}`

  const existing = errorStats.get(key)
  if (existing) {
    existing.count++
    existing.lastOccurred = new Date()
  } else {
    errorStats.set(key, {
      count: 1,
      lastOccurred: new Date(),
      category: context.category,
    })
  }
}

/**
 * Get error statistics (useful for debugging)
 */
export function getErrorStats(): Map<string, ErrorStats> {
  return new Map(errorStats)
}

/**
 * Clear error statistics
 */
export function clearErrorStats(): void {
  errorStats.clear()
}

