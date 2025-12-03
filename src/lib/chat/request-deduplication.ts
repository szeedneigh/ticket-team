/**
 * Request Deduplication Service
 *
 * Prevents duplicate AI chat requests from being processed simultaneously.
 * Uses an in-memory cache with automatic cleanup to deduplicate identical messages.
 *
 * @module lib/chat/request-deduplication
 */

import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

interface PendingRequest {
  promise: Promise<string>
  timestamp: number
  subscribers: number
}

// ============================================================================
// In-Memory Cache
// ============================================================================

/**
 * Cache of pending requests keyed by normalized message
 * Format: Map<messageHash, PendingRequest>
 */
const pendingRequests = new Map<string, PendingRequest>()

/**
 * Cache cleanup interval (ms)
 * Cleanup runs every 60 seconds
 */
const CLEANUP_INTERVAL = 60 * 1000

/**
 * Request timeout (ms)
 * Requests older than 5 minutes are considered stale
 */
const REQUEST_TIMEOUT = 5 * 60 * 1000

// ============================================================================
// Cache Cleanup
// ============================================================================

/**
 * Clean up stale requests from cache
 * Runs periodically to prevent memory leaks
 */
function cleanupStaleRequests() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} stale chat requests from cache`)
  }
}

// Start cleanup timer
if (typeof window === 'undefined') {
  // Only run cleanup on server-side
  setInterval(cleanupStaleRequests, CLEANUP_INTERVAL)
}

// ============================================================================
// Hash Function
// ============================================================================

/**
 * Generate a simple hash for message deduplication
 * Normalizes whitespace and case for better matching
 *
 * @param message - User message
 * @param userId - User ID for user-specific caching
 * @returns Hash string
 */
function generateMessageHash(message: string, userId: string): string {
  // Normalize message: trim, lowercase, collapse whitespace
  const normalized = message.trim().toLowerCase().replace(/\s+/g, ' ')

  // Simple hash combining user ID and normalized message
  return `${userId}:${normalized}`
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get or create a deduplicated request
 *
 * If an identical request is already in progress, returns the existing promise.
 * Otherwise, executes the provided function and caches the result.
 *
 * @param message - User message
 * @param userId - User ID
 * @param fn - Function to execute if no duplicate exists
 * @returns Promise resolving to the AI response
 *
 * @example
 * ```typescript
 * const response = await deduplicateRequest(
 *   "How do I reset my password?",
 *   user.id,
 *   async () => {
 *     return await generateAIResponse(message)
 *   }
 * )
 * ```
 */
export async function deduplicateRequest(
  message: string,
  userId: string,
  fn: () => Promise<string>
): Promise<string> {
  const hash = generateMessageHash(message, userId)

  // Check if request already exists
  const existing = pendingRequests.get(hash)

  if (existing) {
    // Request already in progress - increment subscribers and return existing promise
    existing.subscribers++
    logger.debug(
      `Deduplicated chat request: ${existing.subscribers} subscribers waiting`,
      { hash }
    )

    try {
      return await existing.promise
    } finally {
      // Decrement subscribers
      existing.subscribers--

      // Remove from cache if no more subscribers
      if (existing.subscribers === 0) {
        pendingRequests.delete(hash)
      }
    }
  }

  // No existing request - create new one
  const promise = fn()

  // Add to pending requests
  pendingRequests.set(hash, {
    promise,
    timestamp: Date.now(),
    subscribers: 1,
  })

  try {
    const result = await promise
    return result
  } catch (error) {
    // On error, immediately remove from cache to allow retry
    pendingRequests.delete(hash)
    throw error
  } finally {
    // Automatic cleanup after request completes
    setTimeout(() => {
      const request = pendingRequests.get(hash)
      if (request && request.subscribers === 0) {
        pendingRequests.delete(hash)
      }
    }, 5000) // Keep in cache for 5 seconds after completion
  }
}

/**
 * Check if a request is currently pending
 *
 * @param message - User message
 * @param userId - User ID
 * @returns True if request is pending, false otherwise
 */
export function isRequestPending(message: string, userId: string): boolean {
  const hash = generateMessageHash(message, userId)
  return pendingRequests.has(hash)
}

/**
 * Get cache statistics
 *
 * @returns Object with cache size and pending request count
 */
export function getCacheStats() {
  return {
    pendingRequests: pendingRequests.size,
    totalSubscribers: Array.from(pendingRequests.values()).reduce(
      (sum, req) => sum + req.subscribers,
      0
    ),
  }
}

/**
 * Clear all pending requests from cache
 * Useful for testing or manual cache invalidation
 */
export function clearCache() {
  const size = pendingRequests.size
  pendingRequests.clear()
  logger.debug(`Cleared ${size} requests from deduplication cache`)
}
