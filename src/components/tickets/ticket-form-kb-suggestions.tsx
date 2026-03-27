 /**
 * Ticket Form KB Suggestions Component
 *
 * Shows relevant KB articles based on title + description as the user types.
 * Uses debounced semantic search to suggest articles that might help before submission.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MIN_QUERY_LENGTH = 15
const DEBOUNCE_MS = 400
const SEARCH_THRESHOLD = 0.6
const SEARCH_LIMIT = 5
/** Reuse successful responses for the same query to reduce embedding API calls. */
const RESULT_CACHE_MAX = 32

interface KBArticleResult {
  id: string
  title: string
  content: string
  summary: string | null
  category: string
  subcategory: string | null
  tags: string[]
  similarity: number
}

function cacheKey(query: string): string {
  return query.trim().toLowerCase()
}

function getCached(
  map: Map<string, KBArticleResult[]>,
  key: string
): KBArticleResult[] | undefined {
  return map.get(key)
}

function setCached(map: Map<string, KBArticleResult[]>, key: string, results: KBArticleResult[]) {
  if (map.size >= RESULT_CACHE_MAX) {
    const first = map.keys().next().value as string | undefined
    if (first !== undefined) map.delete(first)
  }
  map.set(key, results)
}

interface TicketFormKBSuggestionsProps {
  query: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function TicketFormKBSuggestions({ query }: TicketFormKBSuggestionsProps) {
  const [results, setResults] = useState<KBArticleResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [selectedArticle, setSelectedArticle] = useState<KBArticleResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const resultCacheRef = useRef<Map<string, KBArticleResult[]>>(new Map())

  const trimmedQuery = query.trim()
  const debouncedQuery = useDebounce(trimmedQuery, DEBOUNCE_MS)
  const shouldSearch = debouncedQuery.length >= MIN_QUERY_LENGTH

  const performSearch = useCallback(async (searchQuery: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const key = cacheKey(searchQuery)
    const cached = getCached(resultCacheRef.current, key)
    if (cached) {
      setResults(cached)
      setError(false)
      setErrorMessage(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setError(false)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/kb/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          threshold: SEARCH_THRESHOLD,
          limit: SEARCH_LIMIT,
        }),
        signal: controller.signal,
      })

      const data = (await response.json().catch(() => ({}))) as {
        results?: unknown
        error?: string
        code?: string
      }

      if (!response.ok) {
        setError(true)
        setResults([])
        setErrorMessage(
          typeof data?.error === 'string' && data.error.length > 0
            ? data.error
            : 'Suggestions temporarily unavailable'
        )
        return
      }

      const articles: KBArticleResult[] = Array.isArray(data?.results) ? data.results : []
      setResults(articles)
      setCached(resultCacheRef.current, key, articles)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      setError(true)
      setResults([])
      setErrorMessage('Suggestions temporarily unavailable')
    } finally {
      setIsSearching(false)
      abortRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!shouldSearch) {
      setResults([])
      setError(false)
      setErrorMessage(null)
      return
    }
    performSearch(debouncedQuery)
  }, [debouncedQuery, shouldSearch, performSearch, retryToken])

  // Don't render until user has typed enough
  if (!shouldSearch && !isSearching) {
    return null
  }

  // Loading state
  if (isSearching) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0693D2] border-t-transparent" />
          <span>Searching for related articles...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Error state — show server message when available + retry
  if (error) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          {errorMessage ?? 'Suggestions temporarily unavailable'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              const key = cacheKey(debouncedQuery)
              resultCacheRef.current.delete(key)
              setRetryToken((t) => t + 1)
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // No results - don't show section
  if (results.length === 0) {
    return null
  }

  const truncate = (text: string, maxLen: number) =>
    text.length <= maxLen ? text : text.substring(0, maxLen).trim() + '...'

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#0693D2]" />
          <h4 className="text-sm font-medium">Articles that might help</h4>
        </div>
        <ul className="space-y-2">
          {results.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => setSelectedArticle(article)}
                className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group text-left"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-[#0693D2] transition-colors line-clamp-1">
                    {article.title}
                  </span>
                  {(article.summary || article.content) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {truncate(article.summary || article.content, 120)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium',
                      article.similarity >= 0.8 && 'bg-blue-500/10 text-blue-700 border-blue-500/20',
                      article.similarity >= 0.6 && article.similarity < 0.8 && 'bg-purple-500/10 text-purple-700 border-purple-500/20',
                      article.similarity < 0.6 && 'bg-gray-500/10 text-gray-700 border-gray-500/20'
                    )}
                  >
                    {Math.round(article.similarity * 100)}%
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Article Preview Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">{selectedArticle?.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {selectedArticle?.category}
                </Badge>
                {selectedArticle?.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {selectedArticle.subcategory}
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedArticle?.summary || truncate(selectedArticle?.content || '', 300)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedArticle(null)}>
              Close
            </Button>
            <Button asChild>
              <Link
                href={`/article/${selectedArticle?.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                See Full Article
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
