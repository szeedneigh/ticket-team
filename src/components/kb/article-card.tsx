/**
 * Article Card Component
 *
 * Displays a KB article preview card with glassmorphism styling.
 * Used in the browse page grid layout.
 * Optimized with React.memo to prevent unnecessary re-renders.
 */

import { memo } from 'react'
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

export const ArticleCard = memo(function ArticleCard({ article, className }: ArticleCardProps) {
  const helpfulnessPercent = article.total_votes > 0
    ? Math.round((article.helpful_votes / article.total_votes) * 100)
    : 0

  const publishedDate = article.published_at
    ? formatRelativeTime(article.published_at)
    : formatRelativeTime(article.created_at)

  return (
    <Link href={`/kb/${article.id}`} className="block h-full group/card">
      <article
        className={cn(
          'relative p-6 rounded-2xl h-full flex flex-col gap-4',
          'bg-background/40 backdrop-blur-md',
          'border border-white/10 dark:border-white/5',
          'transition-all duration-300 ease-out',
          'hover:border-[#2cafdd]/50 hover:bg-[#2cafdd]/5 hover:shadow-lg hover:shadow-[#2cafdd]/10 hover:-translate-y-1',
          className
        )}
      >
        {/* Header: Category & Stats */}
        <div className="flex items-start justify-between gap-2 relative z-10">
          <CategoryBadge
            category={article.category}
            subcategory={article.subcategory}
          />
          {article.total_votes > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/50 px-2.5 py-1 rounded-full border border-white/10 group-hover/card:border-[#2cafdd]/30 group-hover/card:text-[#2cafdd] transition-colors">
              <ThumbsUp className="h-3 w-3 group-hover/card:text-[#2cafdd] transition-colors" />
              <span>{helpfulnessPercent}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow space-y-3 relative z-10">
          <h3 className="font-bold text-xl leading-snug group-hover/card:text-[#2cafdd] transition-colors duration-300">
            {article.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {article.summary || 'No summary available'}
          </p>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="relative z-10 pt-1">
            <TagList tags={article.tags} maxDisplay={3} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/10 group-hover/card:border-[#2cafdd]/20 transition-colors relative z-10">
          {/* Author */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 ring-2 ring-background/20 group-hover/card:ring-[#2cafdd]/20 transition-all">
              <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-[#1f3463] to-[#2cafdd] text-white">
                {getInitials(article.author.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px] group-hover/card:text-foreground transition-colors">
              {article.author.full_name}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
            <div className="flex items-center gap-1.5" title={`${article.view_count} views`}>
              <Eye className="h-3.5 w-3.5 group-hover/card:text-[#2cafdd] transition-colors" />
              <span>{article.view_count}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-border group-hover/card:bg-[#2cafdd]/50 transition-colors" />
            <span>{publishedDate}</span>
          </div>
        </div>
      </article>
    </Link>
  )
})
