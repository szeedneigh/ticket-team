/**
 * ChatSources Component
 *
 * Displays KB articles used as context with:
 * - Article title, category, and similarity score
 * - Link to article detail page
 * - Collapsible accordion (collapsed by default)
 * - Max 5 sources displayed per message
 *
 * @module components/chat/chat-sources
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RAGContext } from '@/lib/types/ai'

// ============================================================================
// Types
// ============================================================================

export interface ChatSourcesProps {
  sources: RAGContext[]
  maxSources?: number
  defaultExpanded?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function ChatSources({
  sources,
  maxSources = 5,
  defaultExpanded = false,
}: ChatSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Limit sources to maxSources
  const displayedSources = sources.slice(0, maxSources)

  if (sources.length === 0) {
    return null
  }

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <Button
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-between px-3 py-2 hover:bg-muted"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="chat-sources-content"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Referenced Knowledge Base Articles
          </span>
          <Badge variant="secondary" className="ml-2">
            {sources.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Content */}
      {isExpanded && (
        <div
          id="chat-sources-content"
          className="space-y-2 animate-in fade-in-50 slide-in-from-top-2"
        >
          {displayedSources.map((source, index) => {
            const category = (source.metadata as { category?: string })?.category
            const relevanceScore = Math.round(source.similarity * 100)

            return (
              <Card
                key={source.article_id || index}
                className="overflow-hidden transition-all hover:border-primary hover:shadow-sm"
              >
                <Link
                  href={`/kb/${source.article_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4"
                >
                  {/* Header Row */}
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h4 className="flex-1 font-medium text-sm leading-tight group-hover:text-primary">
                      {source.title}
                    </h4>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors hover:text-primary" />
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {/* Category Badge */}
                    {category && (
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        {category}
                      </Badge>
                    )}

                    {/* Relevance Score */}
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        relevanceScore >= 90
                          ? 'text-green-600 dark:text-green-500'
                          : relevanceScore >= 70
                            ? 'text-blue-600 dark:text-blue-500'
                            : 'text-yellow-600 dark:text-yellow-500'
                      )}
                      title={`${relevanceScore}% relevance to your question`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">{relevanceScore}%</span>
                      <span className="text-muted-foreground">relevance</span>
                    </div>
                  </div>

                  {/* Content Preview (first 150 chars) */}
                  {source.content && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {source.content.substring(0, 150)}
                      {source.content.length > 150 && '...'}
                    </p>
                  )}
                </Link>
              </Card>
            )
          })}

          {/* Show More Indicator */}
          {sources.length > maxSources && (
            <p className="px-3 text-xs text-muted-foreground">
              + {sources.length - maxSources} more article
              {sources.length - maxSources !== 1 && 's'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
