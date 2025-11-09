/**
 * Semantic Search Results Component
 *
 * Displays articles found via AI-powered semantic search with relevance scores.
 * Shows similarity percentage and highlights the matching context.
 */

'use client'

import Link from 'next/link'
import { Sparkles, Eye, ThumbsUp, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from './category-badge'
import { cn } from '@/lib/utils'

interface SemanticSearchResult {
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

interface SemanticSearchResultsProps {
  query: string
  results: SemanticSearchResult[]
  isLoading?: boolean
}

export function SemanticSearchResults({ query, results, isLoading }: SemanticSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0693D2] border-t-transparent" />
          <span>Searching with AI...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">AI-Powered Search</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Search by meaning, not just keywords. Ask questions naturally and find relevant articles even if they don&apos;t contain your exact words.
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We couldn&apos;t find any articles matching &ldquo;<strong>{query}</strong>&rdquo;. Try rephrasing your question or using different keywords.
        </p>
      </div>
    )
  }

  // Helper to get relevance badge color
  const getRelevanceBadge = (similarity: number) => {
    const percentage = Math.round(similarity * 100)
    if (percentage >= 90) return { label: 'Excellent Match', className: 'bg-green-500/10 text-green-700 border-green-500/20' }
    if (percentage >= 80) return { label: 'Great Match', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' }
    if (percentage >= 70) return { label: 'Good Match', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' }
    return { label: 'Relevant', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' }
  }

  // Helper to truncate content
  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  // Helper to calculate helpfulness rate
  const getHelpfulnessRate = (helpfulVotes: number, totalVotes: number) => {
    if (totalVotes === 0) return null
    return Math.round((helpfulVotes / totalVotes) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#0693D2]" />
          <p className="text-sm font-medium">
            Found <span className="font-bold text-[#0693D2]">{results.length}</span> relevant article{results.length !== 1 ? 's' : ''} for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
          </p>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((article) => {
          const relevanceBadge = getRelevanceBadge(article.similarity)
          const helpfulnessRate = getHelpfulnessRate(article.helpful_votes, article.total_votes)

          return (
            <Card key={article.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CategoryBadge category={article.category} />
                  <Badge
                    variant="outline"
                    className={cn('text-xs font-medium', relevanceBadge.className)}
                  >
                    {Math.round(article.similarity * 100)}% {relevanceBadge.label}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2 group-hover:text-[#0693D2] transition-colors">
                  <Link href={`/kb/${article.id}`}>
                    {article.title}
                  </Link>
                </CardTitle>
                {article.summary && (
                  <CardDescription className="line-clamp-2">
                    {article.summary}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Preview */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {truncateContent(article.content)}
                </p>

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats & Action */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.view_count}</span>
                    </div>
                    {helpfulnessRate !== null && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{helpfulnessRate}%</span>
                      </div>
                    )}
                  </div>
                  <Button asChild variant="ghost" size="sm" className="h-7">
                    <Link href={`/kb/${article.id}`}>
                      View
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
