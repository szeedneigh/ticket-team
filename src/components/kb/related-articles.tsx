/**
 * Related Articles Component
 *
 * Displays semantically related KB articles based on vector similarity.
 * Falls back to same-category articles if embeddings are unavailable.
 * Optimized with React.memo to prevent unnecessary re-renders.
 */

import { memo } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, ThumbsUp } from 'lucide-react'
import { CategoryBadge } from './category-badge'
import type { KnowledgeArticle } from '@/lib/types/knowledge-base'

interface RelatedArticlesProps {
  articles: Partial<KnowledgeArticle>[]
}

export const RelatedArticles = memo(function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {articles.map((article) => (
        <RelatedArticleItem key={article.id} article={article} />
      ))}
    </div>
  )
})

interface RelatedArticleItemProps {
  article: Partial<KnowledgeArticle>
}

const RelatedArticleItem = memo(function RelatedArticleItem({ article }: RelatedArticleItemProps) {
  const helpfulnessPercent = article.total_votes && article.total_votes > 0 && article.helpful_votes
    ? Math.round((article.helpful_votes / article.total_votes) * 100)
    : 0

  return (
    <Link
      href={`/article/${article.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block p-5 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      {/* Hover Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
      
      <div className="relative space-y-3">
        {/* Category */}
        {article.category && (
          <CategoryBadge
            category={article.category}
            subcategory={article.subcategory}
          />
        )}

        {/* Title */}
        <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {article.title}
        </h4>

        {/* Summary */}
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {article.view_count !== undefined && (
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>{article.view_count.toLocaleString()}</span>
              </div>
            )}
            {helpfulnessPercent > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{helpfulnessPercent}%</span>
              </div>
            )}
          </div>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Read more
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
})

