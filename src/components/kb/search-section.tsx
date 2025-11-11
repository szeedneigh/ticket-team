/**
 * Search Section Component
 *
 * Client component with debounced search input and keyboard shortcuts.
 * Supports both keyword search (URL-based) and semantic search (AI-powered).
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface SemanticResult {
  id: string
  title: string
  content: string
  summary: string | null
  category: string
  subcategory: string | null
  tags: string[]
  view_count: number
  helpful_votes: number
  total_votes: number
  similarity: number
}

interface SearchSectionProps {
  defaultValue?: string
  placeholder?: string
  className?: string
  onSemanticSearch?: (query: string, results: SemanticResult[]) => void
  onSemanticSearchStart?: () => void
  onSemanticSearchEnd?: () => void
}

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function SearchSection({
  defaultValue = '',
  placeholder = 'Search knowledge base...',
  className,
  onSemanticSearch,
  onSemanticSearchStart,
  onSemanticSearchEnd
}: SearchSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(defaultValue)
  const [isSemanticMode, setIsSemanticMode] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Perform semantic search via API
  const performSemanticSearch = useCallback(async (query: string) => {
    if (!query.trim() || !isSemanticMode) return

    setIsSearching(true)
    onSemanticSearchStart?.()

    try {
      const response = await fetch('/api/kb/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, threshold: 0.7, limit: 20 })
      })

      if (!response.ok) {
        throw new Error('Semantic search failed')
      }

      const data = await response.json()
      onSemanticSearch?.(query, data.results)
    } catch (error) {
      console.error('Semantic search error:', error)
      onSemanticSearch?.(query, [])
    } finally {
      setIsSearching(false)
      onSemanticSearchEnd?.()
    }
  }, [isSemanticMode, onSemanticSearch, onSemanticSearchStart, onSemanticSearchEnd])

  // Update URL for keyword search OR trigger semantic search
  useEffect(() => {
    if (isSemanticMode) {
      // Semantic search mode - call API
      if (debouncedSearch) {
        performSemanticSearch(debouncedSearch)
      } else {
        onSemanticSearch?.('', [])
      }
    } else {
      // Keyword search mode - update URL params
      const params = new URLSearchParams(searchParams.toString())

      if (debouncedSearch) {
        params.set('search', debouncedSearch)
        params.delete('page') // Reset to page 1 on new search
      } else {
        params.delete('search')
      }

      const newUrl = params.toString() ? `${pathname}?${params}` : pathname
      router.push(newUrl, { scroll: false })
    }
  }, [debouncedSearch, pathname, router, searchParams, isSemanticMode, performSemanticSearch, onSemanticSearch])

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('kb-search-input')
        input?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClear = useCallback(() => {
    setSearchTerm('')
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="semantic-mode"
            checked={isSemanticMode}
            onCheckedChange={setIsSemanticMode}
          />
          <Label htmlFor="semantic-mode" className="flex items-center gap-2 cursor-pointer">
            <Sparkles className={cn(
              'h-4 w-4 transition-colors',
              isSemanticMode ? 'text-[#0693D2]' : 'text-muted-foreground'
            )} />
            <span className="text-sm font-medium">
              {isSemanticMode ? 'AI Search' : 'Keyword Search'}
            </span>
          </Label>
        </div>
        {isSemanticMode && (
          <p className="text-xs text-muted-foreground">
            Search by meaning, not just keywords
          </p>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className={cn(
          'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
          isSearching ? 'text-[#0693D2] animate-pulse' : 'text-muted-foreground'
        )} />
        <Input
          id="kb-search-input"
          type="text"
          placeholder={isSemanticMode ? 'Ask a question or describe what you need...' : placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-20"
          disabled={isSearching}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm && !isSearching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
          {isSearching && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0693D2] border-t-transparent" />
          )}
          {!isSemanticMode && (
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>
    </div>
  )
}
