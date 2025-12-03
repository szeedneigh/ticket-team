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
  const [isFocused, setIsFocused] = useState(false)
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

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleModeChange = useCallback((isAi: boolean) => {
    setIsSemanticMode(isAi)
    // Clear search results when switching modes if not already empty
    if (searchTerm) {
      setSearchTerm('')
      onSemanticSearch?.('', []) // Clear semantic results if switching from AI
    }
  }, [searchTerm, onSemanticSearch])

  return (
    <div className={cn('w-full max-w-3xl mx-auto space-y-6', className)}>
      {/* Search Input Container */}
      <div className="relative group max-w-2xl mx-auto">
        {/* Glow Effect */}
        <div className={cn(
          "absolute inset-0 rounded-3xl bg-gradient-to-r from-[#1f3463]/20 via-[#2cafdd]/20 to-[#1f3463]/20 blur-xl transition-opacity duration-500",
          isSearching ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        )} />
        
        <div className="relative flex items-center gap-2 rounded-3xl bg-background/60 p-2 shadow-lg backdrop-blur-xl ring-1 ring-white/20 dark:ring-white/10 transition-all duration-300 hover:shadow-xl hover:ring-[#2cafdd]/30 focus-within:ring-[#2cafdd]/50 focus-within:shadow-[#2cafdd]/20">
          <Search className={cn(
            "ml-4 h-5 w-5 transition-colors duration-300",
            isFocused ? "text-[#2cafdd]" : "text-muted-foreground"
          )} />
          
          <Input
            id="kb-search-input" // Keep ID for keyboard shortcut
            type="text"
            placeholder={isSemanticMode ? "Ask a question (e.g., 'How do I reset my password?')" : placeholder}
            className="flex-1 border-0 bg-transparent px-2 py-3 text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isSearching} // Keep disabled state
          />

          {/* Search Mode Toggle */}
          <div className="flex items-center gap-2 pr-2">
            {searchTerm && !isSearching && ( // Re-add clear button logic
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSearch('')} // Clear search term
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
              
              {isSearching && ( // Re-add spinner logic
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}

            <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-full p-1 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange(false)}
                className={cn(
                  "h-7 rounded-full px-3 text-xs font-medium transition-all duration-300",
                  !isSemanticMode 
                    ? "bg-white shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Keyword
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange(true)}
                className={cn(
                  "h-7 rounded-full px-3 text-xs font-medium transition-all duration-300 gap-1.5",
                  isSemanticMode 
                    ? "bg-gradient-to-r from-[#1f3463] to-[#2cafdd] text-white shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="w-3 h-3" />
                AI Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
