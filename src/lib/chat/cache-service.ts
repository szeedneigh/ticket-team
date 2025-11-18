/**
 * Cache Service for RAG
 *
 * Implements in-memory caching with LRU eviction and TTL support
 * for embeddings, KB article retrievals, and FAQ responses
 *
 * @module lib/chat/cache-service
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  hits: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

/**
 * Generic LRU Cache with TTL support
 */
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number
  private ttlMs: number
  private hits: number = 0
  private misses: number = 0

  constructor(maxSize: number = 100, ttlMs: number = 5 * 60 * 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return null
    }

    // Check if expired
    const now = Date.now()
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    // Update access stats
    entry.hits++
    this.hits++

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    // Remove if already exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    }
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size
  }
}

// ============================================================================
// Embedding Cache
// ============================================================================

interface EmbeddingCacheEntry {
  embedding: number[]
  query: string
}

const embeddingCache = new LRUCache<number[]>(500, 60 * 60 * 1000) // 500 entries, 1 hour TTL

/**
 * Generate a cache key for an embedding query
 */
function generateEmbeddingCacheKey(query: string): string {
  // Normalize query: lowercase, trim, remove extra spaces
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ')
  return `emb:${normalized}`
}

/**
 * Get cached embedding or return null
 */
export function getCachedEmbedding(query: string): number[] | null {
  const key = generateEmbeddingCacheKey(query)
  return embeddingCache.get(key)
}

/**
 * Cache an embedding
 */
export function cacheEmbedding(query: string, embedding: number[]): void {
  const key = generateEmbeddingCacheKey(query)
  embeddingCache.set(key, embedding)
}

/**
 * Get embedding cache stats
 */
export function getEmbeddingCacheStats(): CacheStats {
  return embeddingCache.getStats()
}

// ============================================================================
// KB Article Retrieval Cache
// ============================================================================

import type { RAGContext } from '@/lib/types/ai'

interface RetrievalCacheEntry {
  articles: RAGContext[]
  confidence: number
  hadResults: boolean
}

const retrievalCache = new LRUCache<RetrievalCacheEntry>(200, 5 * 60 * 1000) // 200 entries, 5 min TTL

/**
 * Generate a cache key for KB article retrieval
 */
function generateRetrievalCacheKey(
  query: string,
  maxArticles: number,
  similarityThreshold: number
): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ')
  return `ret:${normalized}:${maxArticles}:${similarityThreshold}`
}

/**
 * Get cached retrieval result or return null
 */
export function getCachedRetrieval(
  query: string,
  maxArticles: number,
  similarityThreshold: number
): RetrievalCacheEntry | null {
  const key = generateRetrievalCacheKey(query, maxArticles, similarityThreshold)
  return retrievalCache.get(key)
}

/**
 * Cache a retrieval result
 */
export function cacheRetrieval(
  query: string,
  maxArticles: number,
  similarityThreshold: number,
  result: RetrievalCacheEntry
): void {
  const key = generateRetrievalCacheKey(query, maxArticles, similarityThreshold)
  retrievalCache.set(key, result)
}

/**
 * Get retrieval cache stats
 */
export function getRetrievalCacheStats(): CacheStats {
  return retrievalCache.getStats()
}

// ============================================================================
// FAQ Response Cache
// ============================================================================

interface FAQCacheEntry {
  answer: string
  citations: string[]
  contextArticles: RAGContext[]
  confidence: number
}

const faqCache = new LRUCache<FAQCacheEntry>(100, 10 * 60 * 1000) // 100 entries, 10 min TTL

/**
 * Generate a cache key for FAQ responses
 */
function generateFAQCacheKey(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ')
  return `faq:${normalized}`
}

/**
 * Get cached FAQ response or return null
 */
export function getCachedFAQ(query: string): FAQCacheEntry | null {
  const key = generateFAQCacheKey(query)
  return faqCache.get(key)
}

/**
 * Cache an FAQ response
 */
export function cacheFAQ(query: string, result: FAQCacheEntry): void {
  const key = generateFAQCacheKey(query)
  faqCache.set(key, result)
}

/**
 * Get FAQ cache stats
 */
export function getFAQCacheStats(): CacheStats {
  return faqCache.getStats()
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  embeddingCache.clear()
  retrievalCache.clear()
  faqCache.clear()
}

/**
 * Get combined cache statistics
 */
export function getAllCacheStats() {
  return {
    embedding: getEmbeddingCacheStats(),
    retrieval: getRetrievalCacheStats(),
    faq: getFAQCacheStats(),
  }
}

/**
 * Invalidate caches when KB articles are updated
 * Should be called after KB article create/update/delete
 */
export function invalidateKBCaches(): void {
  retrievalCache.clear()
  faqCache.clear()
  // Keep embedding cache as it's query-based, not content-based
}
