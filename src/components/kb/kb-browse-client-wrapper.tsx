/**
 * KB Browse Client Wrapper
 *
 * Client component wrapper that handles semantic search state
 * while keeping the main browse page as a Server Component.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { SearchSection } from './search-section'
import { SemanticSearchResults } from './semantic-search-results'
import { FilterBar } from './filter-bar'
import { ArticleCard } from './article-card'
import { Pagination } from './pagination'
import type { KnowledgeArticleWithAuthor } from '@/lib/types/knowledge-base'

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
  author_id?: string
  author_full_name?: string
  author_email?: string
  author_avatar_url?: string
}

interface KBBrowseClientWrapperProps {
  defaultSearch?: string
  categories: Array<{ category: string; subcategories: string[] }>
  allTags: string[]
  serverArticles: KnowledgeArticleWithAuthor[]
  total: number
  perPage: number
  currentPage: number
  totalPages: number
}

export function KBBrowseClientWrapper({
  defaultSearch,
  categories,
  allTags,
  serverArticles,
  total,
  perPage,
  currentPage,
  totalPages
}: KBBrowseClientWrapperProps) {
  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([])
  const [semanticQuery, setSemanticQuery] = useState('')
  const [isSemanticSearchActive, setIsSemanticSearchActive] = useState(false)

  const handleSemanticSearch = useCallback((query: string, results: SemanticResult[]) => {
    setSemanticQuery(query)
    setSemanticResults(results)
    setIsSemanticSearchActive(query.length > 0)
  }, [])

  const handleSemanticSearchStart = useCallback(() => {
    setIsSemanticSearchActive(true)
  }, [])

  const handleSemanticSearchEnd = useCallback(() => {
    // Keep active state based on whether there's a query
  }, [])


  return (
    <>
      {/* Search Section with Semantic Toggle */}
      <SearchSection
        defaultValue={defaultSearch}
        onSemanticSearch={handleSemanticSearch}
        onSemanticSearchStart={handleSemanticSearchStart}
        onSemanticSearchEnd={handleSemanticSearchEnd}
      />

      {/* Filter Bar (only show for keyword search) */}
      {!isSemanticSearchActive && (
        <FilterBar categories={categories} tags={allTags} />
      )}

      {/* Results Section */}
      {isSemanticSearchActive ? (
        // Semantic Search Results
        <SemanticSearchResults
          query={semanticQuery}
          results={semanticResults}
        />
      ) : (
        // Keyword Search Results (Server-Rendered)
        <>
          {total > 0 && (
            <>
              {/* Article Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {serverArticles.length} of {total} article{total !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Article Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serverArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={perPage}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
