/**
 * Knowledge Base Article Detail Page
 *
 * Server Component that displays a single KB article with full content.
 * Includes author info, metadata, voting section, and related articles.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Eye, Edit } from 'lucide-react'
import { parse } from 'node-html-parser'
import { requireAuth } from '@/lib/auth/session'
import { getArticleById, getUserVote, canUserEditArticle, getRelatedArticles } from '@/lib/kb/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { FeedbackSection } from '@/components/kb/feedback-section'
import { RelatedArticles } from '@/components/kb/related-articles'
import { BreadcrumbNav } from '@/components/kb/breadcrumb-nav'
import { TableOfContents } from '@/components/kb/table-of-contents'
import { isValidUUID } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID format before attempting any operations
  if (!isValidUUID(id)) {
    notFound()
  }

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

  // Get related articles
  const relatedArticles = await getRelatedArticles(id, 5)

  // Format published date
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Draft'

  // Add IDs to headings for TOC navigation
  const contentWithIds = addHeadingIds(article.content)

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={[
          { label: 'Knowledge Base', href: '/kb' },
          { label: article.category, href: `/kb?category=${encodeURIComponent(article.category)}` },
          { label: article.title }
        ]}
      />

      {/* Mobile TOC */}
      <TableOfContents content={contentWithIds} />

      <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-8">
        {/* Main Content */}
        <div>
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
          <article
            className="prose prose-slate dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          <Separator className="my-8" />

          {/* Feedback Section */}
          <FeedbackSection
            articleId={id}
            helpfulVotes={article.helpful_votes}
            totalVotes={article.total_votes}
            userVote={userVote}
          />

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12">
              <RelatedArticles articles={relatedArticles} />
            </div>
          )}
        </div>

        {/* Desktop TOC Sidebar */}
        <TableOfContents content={contentWithIds} />
      </div>
    </div>
  )
}

/**
 * Add IDs to h2 and h3 headings for TOC navigation
 * This ensures headings have stable IDs for linking
 */
function addHeadingIds(html: string): string {
  const doc = parse(html)

  // Find all h2 and h3 elements
  const headings = doc.querySelectorAll('h2, h3')
  const usedIds = new Set<string>()

  headings.forEach((heading: any, index: number) => {
    const text = heading.text || ''
    // Generate ID from text
    let id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

    // Ensure unique IDs
    if (usedIds.has(id)) {
      id = `${id}-${index}`
    }

    usedIds.add(id)
    heading.setAttribute('id', id)
  })

  return doc.toString()
}
