/**
 * Rate Limiter for AI Chat
 *
 * Implements token bucket algorithm for rate limiting chat requests
 * Prevents API abuse and manages Gemini API quotas
 *
 * @module lib/chat/rate-limiter
 */

import { logger } from '@/lib/logger'

interface RateLimitEntry {
  tokens: number
  lastRefill: number
  requestCount: number
}

interface RateLimitConfig {
  maxTokens: number // Maximum tokens in bucket
  refillRate: number // Tokens added per minute
  costPerRequest: number // Tokens consumed per request
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // Seconds until next refill
  retryAfter?: number // Seconds to wait before retry (if not allowed)
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: RateLimitConfig = {
  maxTokens: 10, // 10 requests burst capacity
  refillRate: 10, // 10 tokens per minute (10 req/min)
  costPerRequest: 1, // 1 token per request
}

// Rate limits by user ID
const rateLimits = new Map<string, RateLimitEntry>()

// ============================================================================
// Token Bucket Algorithm
// ============================================================================

/**
 * Refill tokens based on time elapsed
 */
function refillTokens(entry: RateLimitEntry, config: RateLimitConfig): void {
  const now = Date.now()
  const elapsedMs = now - entry.lastRefill
  const elapsedMinutes = elapsedMs / (60 * 1000)

  // Calculate tokens to add
  const tokensToAdd = Math.floor(elapsedMinutes * config.refillRate)

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd)
    entry.lastRefill = now
  }
}

/**
 * Check if request is allowed and consume tokens
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  // Get or create entry
  let entry = rateLimits.get(userId)

  if (!entry) {
    entry = {
      tokens: config.maxTokens,
      lastRefill: Date.now(),
      requestCount: 0,
    }
    rateLimits.set(userId, entry)
  }

  // Refill tokens
  refillTokens(entry, config)

  // Check if request is allowed
  if (entry.tokens >= config.costPerRequest) {
    // Allow request and consume tokens
    entry.tokens -= config.costPerRequest
    entry.requestCount++

    return {
      allowed: true,
      remaining: entry.tokens,
      resetIn: 60, // Next refill in 60 seconds
    }
  } else {
    // Rate limit exceeded
    const tokensNeeded = config.costPerRequest - entry.tokens
    const minutesUntilRefill = tokensNeeded / config.refillRate
    const secondsUntilRefill = Math.ceil(minutesUntilRefill * 60)

    return {
      allowed: false,
      remaining: 0,
      resetIn: secondsUntilRefill,
      retryAfter: secondsUntilRefill,
    }
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
export function resetRateLimit(userId: string): void {
  rateLimits.delete(userId)
}

/**
 * Get rate limit status without consuming tokens
 */
export function getRateLimitStatus(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): {
  remaining: number
  requestCount: number
  resetIn: number
} {
  const entry = rateLimits.get(userId)

  if (!entry) {
    return {
      remaining: config.maxTokens,
      requestCount: 0,
      resetIn: 60,
    }
  }

  // Refill tokens (without modifying entry)
  const now = Date.now()
  const elapsedMs = now - entry.lastRefill
  const elapsedMinutes = elapsedMs / (60 * 1000)
  const tokensToAdd = Math.floor(elapsedMinutes * config.refillRate)
  const currentTokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd)

  return {
    remaining: currentTokens,
    requestCount: entry.requestCount,
    resetIn: 60,
  }
}

/**
 * Get all rate limit stats (for monitoring)
 */
export function getRateLimitStats(): {
  totalUsers: number
  activeUsers: number
  totalRequests: number
} {
  let totalRequests = 0
  let activeUsers = 0

  const oneHourAgo = Date.now() - 60 * 60 * 1000

  for (const entry of rateLimits.values()) {
    totalRequests += entry.requestCount

    // Count as active if used in last hour
    if (entry.lastRefill > oneHourAgo) {
      activeUsers++
    }
  }

  return {
    totalUsers: rateLimits.size,
    activeUsers,
    totalRequests,
  }
}

/**
 * Clean up old entries (should be called periodically)
 */
export function cleanupRateLimits(): number {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  let removed = 0

  for (const [userId, entry] of rateLimits.entries()) {
    // Remove entries inactive for more than 1 hour
    if (entry.lastRefill < oneHourAgo && entry.tokens === DEFAULT_CONFIG.maxTokens) {
      rateLimits.delete(userId)
      removed++
    }
  }

  return removed
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2, // Double delay each time
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  attempt: number = 0
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // Check if we should retry
    if (attempt >= config.maxRetries) {
      throw error
    }

    // Check if error is retryable
    if (!isRetryableError(error)) {
      throw error
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelayMs
    )

    logger.debug(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`)

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Retry
    return retryWithBackoff(fn, config, attempt + 1)
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Retry on network errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('enotfound') ||
      message.includes('econnrefused')
    ) {
      return true
    }

    // Retry on rate limit errors (429)
    if (message.includes('429') || message.includes('quota') || message.includes('rate limit')) {
      return true
    }

    // Retry on temporary server errors (503, 504)
    if (message.includes('503') || message.includes('504') || message.includes('unavailable')) {
      return true
    }
  }

  return false
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

interface CircuitState {
  failures: number
  lastFailure: number
  state: 'closed' | 'open' | 'half-open'
}

const circuits = new Map<string, CircuitState>()

const CIRCUIT_CONFIG = {
  failureThreshold: 5, // Open circuit after 5 failures
  timeout: 60 * 1000, // Keep circuit open for 1 minute
  halfOpenRequests: 1, // Allow 1 request in half-open state
}

/**
 * Execute function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  circuitName: string,
  fn: () => Promise<T>
): Promise<T> {
  let circuit = circuits.get(circuitName)

  if (!circuit) {
    circuit = {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    }
    circuits.set(circuitName, circuit)
  }

  // Check circuit state
  const now = Date.now()

  if (circuit.state === 'open') {
    // Check if timeout has passed
    if (now - circuit.lastFailure > CIRCUIT_CONFIG.timeout) {
      circuit.state = 'half-open'
    } else {
      throw new Error(`Circuit breaker is open for ${circuitName}. Service temporarily unavailable.`)
    }
  }

  try {
    const result = await fn()

    // Success - reset circuit
    circuit.failures = 0
    circuit.state = 'closed'

    return result
  } catch (error) {
    // Failure - increment counter
    circuit.failures++
    circuit.lastFailure = now

    // Open circuit if threshold reached
    if (circuit.failures >= CIRCUIT_CONFIG.failureThreshold) {
      circuit.state = 'open'
      console.error(`Circuit breaker opened for ${circuitName} after ${circuit.failures} failures`)
    }

    throw error
  }
}

/**
 * Get circuit breaker status
 */
export function getCircuitStatus(circuitName: string): CircuitState | null {
  return circuits.get(circuitName) || null
}
