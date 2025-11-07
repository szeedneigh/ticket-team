/**
 * Knowledge Base Article Detail Page
 *
 * Server Component that displays a single KB article with full content.
 * Includes author info, metadata, voting section, and related articles.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, ThumbsUp, ThumbsDown, Edit } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getArticleById, getUserVote, canUserEditArticle } from '@/lib/kb/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()

  // Fetch article
  let article
  try {
    article = await getArticleById(id)
  } catch {
    notFound()
  }

  // Check if user can edit
  const canEdit = await canUserEditArticle(id, user.id, user.role)

  // Get user's existing vote
  const userVote = await getUserVote(id, user.id)

  // Calculate helpfulness percentage
  const helpfulnessPercent =
    article.total_votes > 0
      ? Math.round((article.helpful_votes / article.total_votes) * 100)
      : 0

  // Format published date
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Draft'

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/kb">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Link>
        </Button>
      </div>

      {/* Article Header */}
      <div className="space-y-4 mb-8">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline">{article.category}</Badge>
          {article.subcategory && (
            <Badge variant="outline">{article.subcategory}</Badge>
          )}
          {article.status !== 'published' && (
            <Badge variant="secondary">{article.status}</Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight">{article.title}</h1>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {article.author.avatar_url && (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.full_name}
                />
              )}
            </Avatar>
            <span>{article.author.full_name}</span>
          </div>

          <Separator orientation="vertical" className="h-4" />

          {/* Published Date */}
          <span>{publishedDate}</span>

          <Separator orientation="vertical" className="h-4" />

          {/* View Count */}
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{article.view_count} views</span>
          </div>

          {/* Edit Button (if user can edit) */}
          {canEdit && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/kb/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Summary */}
        {article.summary && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        )}
      </div>

      <Separator className="my-8" />

      {/* Article Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
        {/* Simple content display for now */}
        <div className="whitespace-pre-wrap">{article.content}</div>
      </div>

      <Separator className="my-8" />

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle>Was this article helpful?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={userVote?.is_helpful ? 'default' : 'outline'}
              disabled={!!userVote}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Helpful
            </Button>
            <Button
              variant={userVote && !userVote.is_helpful ? 'default' : 'outline'}
              disabled={!!userVote}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Not Helpful
            </Button>
          </div>

          {/* Vote Statistics */}
          {article.total_votes > 0 && (
            <p className="text-sm text-muted-foreground">
              {article.helpful_votes} out of {article.total_votes} people found
              this helpful ({helpfulnessPercent}%)
            </p>
          )}

          {/* Thank You Message */}
          {userVote && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              ✓ Thank you for your feedback!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Related Articles Placeholder */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Related Articles</h2>
        <p className="text-muted-foreground">
          Related articles will be displayed here based on semantic similarity.
        </p>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for article detail page
 */
export function ArticleDetailSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="space-y-4 mb-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-20 w-full" />
      </div>

      <Separator className="my-8" />

      <div className="space-y-4 mb-12">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
