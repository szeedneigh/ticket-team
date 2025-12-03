import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, Edit } from 'lucide-react'
import { parse } from 'node-html-parser'
import { requireAuth } from '@/lib/auth/session'
import { getArticleById, getUserVote, canUserEditArticle, getRelatedArticles } from '@/lib/kb/queries'
import { sanitizeHTML } from '@/lib/utils/sanitize'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

// ISR for KB articles - they don't change frequently once published
export const revalidate = 3600 // Revalidate every hour

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

  // Add IDs to headings for TOC navigation and sanitize HTML
  const contentWithIds = addHeadingIds(article.content)
  const sanitizedContent = sanitizeHTML(contentWithIds)

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header Background */}
      <div className="absolute top-0 inset-x-0 h-[500px] border-b border-border/40 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />
      </div>
      
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-12">
          <BreadcrumbNav
            items={[
              { label: 'Knowledge Base', href: '/kb' },
              { label: article.category, href: `/kb?category=${encodeURIComponent(article.category)}` },
              { label: article.title }
            ]}
          />
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          {/* Main Content */}
          <main className="min-w-0">
            {/* Article Header */}
            <div className="space-y-6 mb-12">
              {/* Category & Status */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  {article.category}
                </Badge>
                {article.subcategory && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {article.subcategory}
                  </Badge>
                )}
                {article.status !== 'published' && (
                  <Badge variant={article.status === 'draft' ? 'secondary' : 'destructive'}>
                    {article.status}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {article.title}
              </h1>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b border-border/50 pb-8">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-background">
                    {article.author.avatar_url && (
                      <Image
                        src={article.author.avatar_url}
                        alt={article.author.full_name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {article.author.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{article.author.full_name}</span>
                    <span className="text-xs">Author</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-border/50 hidden sm:block" />

                {/* Date & Views */}
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{publishedDate}</span>
                    <span className="text-xs">Last updated</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{article.view_count}</span>
                    </div>
                    <span className="text-xs">Views</span>
                  </div>
                </div>

                {/* Edit Button */}
                {canEdit && (
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <Link href={`/kb/${id}/edit`}>
                        <Edit className="h-4 w-4" />
                        Edit Article
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Summary */}
              {article.summary && (
                <div className="bg-muted/30 border border-border/50 rounded-xl p-6 text-lg text-muted-foreground leading-relaxed italic">
                  {article.summary}
                </div>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="px-3 py-1 text-xs bg-background/50 backdrop-blur-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents content={sanitizedContent} />
            </div>

            {/* Article Content */}
            <article
              className="prose prose-lg prose-slate dark:prose-invert max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight 
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                mb-16"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            <Separator className="my-12" />

            {/* Feedback Section */}
            <div className="bg-muted/30 rounded-2xl p-8 border border-border/50 text-center">
              <h3 className="text-xl font-semibold mb-2">Was this article helpful?</h3>
              <p className="text-muted-foreground mb-6">Your feedback helps us improve our knowledge base.</p>
              <FeedbackSection
                articleId={id}
                helpfulVotes={article.helpful_votes}
                totalVotes={article.total_votes}
                userVote={userVote}
              />
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-16">
                <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
                <RelatedArticles articles={relatedArticles} />
              </div>
            )}
          </main>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block space-y-8">
            <div className="sticky top-24">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-sm">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  On this page
                </h4>
                <TableOfContents content={sanitizedContent} />
              </div>
            </div>
          </aside>
        </div>
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

  headings.forEach((heading, index: number) => {
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
