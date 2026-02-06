import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Eye, Clock, Tag, ExternalLink, BookOpen } from 'lucide-react'
import { sanitizeHTML } from '@/lib/utils/sanitize'
import { isValidUUID, cn } from '@/lib/utils'
import { getArticleById } from '@/lib/kb/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Add unique IDs to h2 and h3 headings for better readability
 */
function addHeadingIds(html: string): string {
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, content) => {
    if (attrs.includes('id=')) {
      return match
    }
    const textContent = content.replace(/<[^>]+>/g, '')
    const id = textContent
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
    return `<${tag}${attrs} id="${id}">${content}</${tag}>`
  })
}

/**
 * Standalone KB Article View
 * 
 * This page displays only the article content without the full app layout (sidebar, navbar).
 * It's designed to be opened in a new tab from the ticket form KB suggestions modal.
 * Design matches the main KB article aesthetic with gradients, animations, and glass effects.
 */
export default async function StandaloneArticlePage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID format before database query
  if (!isValidUUID(id)) {
    notFound()
  }

  // Fetch article
  let article
  try {
    article = await getArticleById(id)
  } catch (error) {
    console.error('Error fetching article:', error)
    notFound()
  }

  // Format date
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Draft'

  // Sanitize content and add heading IDs
  let sanitizedContent = sanitizeHTML(article.content)
  sanitizedContent = addHeadingIds(sanitizedContent)

  // Calculate read time (roughly 200 words per minute)
  const wordCount = article.content.replace(/<[^>]+>/g, '').split(/\s+/).length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Enhanced Ambient Background */}
      <div className="absolute top-0 inset-x-0 h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_80%,transparent_100%)] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/80 to-background" />
        
        {/* Glow Blobs */}
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full mix-blend-plus-lighter animate-pulse" />
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full mix-blend-plus-lighter" />
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground hidden sm:inline">Knowledge Base</span>
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                {article.category}
              </Badge>
              {article.subcategory && (
                <Badge variant="outline" className="hidden sm:flex">
                  {article.subcategory}
                </Badge>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors">
            <Link href={`/kb/${id}`} target="_self">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Open in KB</span>
              <span className="sm:hidden">KB</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Article content */}
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Article Header */}
        <header className="space-y-8 mb-12">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
            {article.title}
          </h1>
          
          {/* Summary */}
          {article.summary && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance font-light border-l-4 border-primary/30 pl-6 py-1">
              {article.summary}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground pt-4 border-t border-border/40">
            <div className="flex items-center gap-2" title={`Published on ${publishedDate}`}>
              <Calendar className="h-4 w-4 text-primary/70" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-2" title={`${readTime} min read`}>
              <Clock className="h-4 w-4 text-primary/70" />
              <span>{readTime} min read</span>
            </div>
            {article.view_count !== undefined && (
              <div className="flex items-center gap-2" title={`${article.view_count.toLocaleString()} views`}>
                <Eye className="h-4 w-4 text-primary/70" />
                <span>{article.view_count.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {article.tags.map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs bg-background/50 hover:bg-muted/50 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Article Body */}
        <article 
          className={cn(
            "prose prose-lg prose-slate dark:prose-invert max-w-none",
            "prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-32",
            "prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/30",
            "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4",
            "prose-p:leading-8 prose-p:text-muted-foreground/90 prose-p:my-6",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors",
            "prose-strong:text-foreground prose-strong:font-bold",
            "prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-border/20 prose-img:my-10",
            "prose-code:bg-muted/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:text-primary prose-code:before:content-none prose-code:after:content-none",
            "prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border/10 prose-pre:rounded-xl prose-pre:shadow-2xl prose-pre:p-6",
            "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:pl-8 prose-blockquote:pr-6 prose-blockquote:py-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-muted-foreground shadow-sm",
            "prose-ul:my-6 prose-li:my-3 prose-li:marker:text-primary/70 prose-li:pl-2",
            "mb-16"
          )}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        <Separator className="my-12 bg-border/40" />

        {/* Footer Card */}
        <footer className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-blue-500/5 border border-border/50 shadow-sm p-8 md:p-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-24 -mt-24" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-lg font-bold text-foreground">Explore More in Knowledge Base</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Access additional features like feedback, related articles, and table of contents in the full dashboard view.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="gap-2 bg-background/50 hover:bg-background border-border/60">
                <Link href="/kb" target="_self">
                  <BookOpen className="h-4 w-4" />
                  Browse Articles
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg">
                <Link href={`/kb/${id}`} target="_self">
                  View Full Article
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </footer>
      </main>

      {/* Simple Footer */}
      <div className="border-t border-border/40 bg-muted/20 py-6">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Ticket Team Knowledge Base • La Verdad Christian College
          </p>
        </div>
      </div>
    </div>
  )
}
