export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

interface WindowEntry {
  timestamps: number[]
  expiresAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __ticketTeamRateLimitStore: Map<string, WindowEntry> | undefined
}

function getStore(): Map<string, WindowEntry> {
  if (!globalThis.__ticketTeamRateLimitStore) {
    globalThis.__ticketTeamRateLimitStore = new Map<string, WindowEntry>()
  }
  return globalThis.__ticketTeamRateLimitStore
}

/**
 * Best-effort sliding-window rate limiter (edge/runtime safe).
 *
 * Notes:
 * - In-memory only: not shared across regions/instances.
 * - Key should include an identifier (usually IP) and a bucket name.
 */
export function rateLimitSlidingWindow(params: {
  key: string
  limit: number
  windowMs: number
  now?: number
}): RateLimitResult {
  const now = params.now ?? Date.now()
  const store = getStore()

  const windowStart = now - params.windowMs
  const entry = store.get(params.key)

  const timestamps = entry?.timestamps ?? []
  const pruned = timestamps.filter((t) => t > windowStart)

  // Opportunistic cleanup of expired buckets
  if (entry && entry.expiresAt <= now) {
    store.delete(params.key)
  }

  const nextTimestamps = pruned
  const allowed = nextTimestamps.length < params.limit

  if (allowed) {
    nextTimestamps.push(now)
  }

  const remaining = Math.max(0, params.limit - nextTimestamps.length)

  const oldest = nextTimestamps[0]
  const retryAfterMs = allowed
    ? 0
    : Math.max(0, params.windowMs - (now - oldest))

  // Keep bucket around slightly beyond the window for cleanup simplicity
  store.set(params.key, {
    timestamps: nextTimestamps,
    expiresAt: now + params.windowMs + 5_000,
  })

  return {
    allowed,
    limit: params.limit,
    remaining,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  }
}

