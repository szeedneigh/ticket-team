/**
 * Article Card Component
 *
 * Displays a KB article preview card with glassmorphism styling.
 * Used in the browse page grid layout.
 */

import Link from 'next/link'
import { Eye, ThumbsUp } from 'lucide-react'
import { CategoryBadge } from './category-badge'
import { TagList } from './tag-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { KnowledgeArticleWithAuthor } from '@/lib/types/knowledge-base'

interface ArticleCardProps {
  article: KnowledgeArticleWithAuthor
  className?: string
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Get initials from full name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const helpfulnessPercent = article.total_votes > 0
    ? Math.round((article.helpful_votes / article.total_votes) * 100)
    : 0

  const publishedDate = article.published_at
    ? formatRelativeTime(article.published_at)
    : formatRelativeTime(article.created_at)

  return (
    <Link href={`/kb/${article.id}`}>
      <article
        className={cn(
          'group relative p-6 rounded-lg border border-border bg-card',
          'hover:shadow-lg hover:-translate-y-1',
          'transition-all duration-200',
          'flex flex-col gap-4 h-full',
          className
        )}
      >
        {/* Category Badge */}
        <div className="flex items-start justify-between gap-2">
          <CategoryBadge
            category={article.category}
            subcategory={article.subcategory}
          />
          {article.total_votes > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              <span>{helpfulnessPercent}%</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
          {article.summary || 'No summary available'}
        </p>

        {/* Tags */}
        {article.tags.length > 0 && (
          <TagList tags={article.tags} maxDisplay={3} />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(article.author.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {article.author.full_name}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{article.view_count}</span>
            </div>
            <span>{publishedDate}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
