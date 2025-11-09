/**
 * Related Articles Component
 *
 * Displays semantically related KB articles based on vector similarity.
 * Falls back to same-category articles if embeddings are unavailable.
 */

import Link from 'next/link'
import { ArrowRight, Eye, ThumbsUp } from 'lucide-react'
import { CategoryBadge } from './category-badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { KnowledgeArticle } from '@/lib/types/knowledge-base'

interface RelatedArticlesProps {
  articles: Partial<KnowledgeArticle>[]
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Related Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.map((article) => (
            <RelatedArticleItem key={article.id} article={article} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface RelatedArticleItemProps {
  article: Partial<KnowledgeArticle>
}

function RelatedArticleItem({ article }: RelatedArticleItemProps) {
  const helpfulnessPercent = article.total_votes && article.total_votes > 0 && article.helpful_votes
    ? Math.round((article.helpful_votes / article.total_votes) * 100)
    : 0

  return (
    <Link
      href={`/kb/${article.id}`}
      className="group block p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
    >
      <div className="space-y-2">
        {/* Category */}
        {article.category && (
          <CategoryBadge
            category={article.category}
            subcategory={article.subcategory}
          />
        )}

        {/* Title */}
        <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>

        {/* Summary */}
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.summary}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {article.view_count !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{article.view_count}</span>
              </div>
            )}
            {helpfulnessPercent > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{helpfulnessPercent}%</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs group-hover:translate-x-1 transition-transform"
          >
            Read more
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </Link>
  )
}
