/**
 * Ticket Form KB Suggestions Component
 *
 * Shows relevant KB articles based on title + description as the user types.
 * Uses debounced semantic search to suggest articles that might help before submission.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const MIN_QUERY_LENGTH = 15
const DEBOUNCE_MS = 400
const SEARCH_THRESHOLD = 0.6
const SEARCH_LIMIT = 5

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
  const abortRef = useRef<AbortController | null>(null)

  const trimmedQuery = query.trim()
  const debouncedQuery = useDebounce(trimmedQuery, DEBOUNCE_MS)
  const shouldSearch = debouncedQuery.length >= MIN_QUERY_LENGTH

  const performSearch = useCallback(async (searchQuery: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsSearching(true)
    setError(false)

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

      if (!response.ok) {
        throw new Error('Semantic search failed')
      }

      const data = await response.json()
      const articles: KBArticleResult[] = Array.isArray(data?.results) ? data.results : []
      setResults(articles)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      setError(true)
      setResults([])
    } finally {
      setIsSearching(false)
      abortRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!shouldSearch) {
      setResults([])
      setError(false)
      return
    }
    performSearch(debouncedQuery)
  }, [debouncedQuery, shouldSearch, performSearch])

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

  // Error state - subtle message
  if (error) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">Suggestions temporarily unavailable</p>
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
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#0693D2]" />
        <h4 className="text-sm font-medium">Articles that might help</h4>
      </div>
      <ul className="space-y-2">
        {results.map((article) => (
          <li key={article.id}>
            <Link
              href={`/kb/${article.id}`}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
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
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
