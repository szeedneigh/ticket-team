'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { Share2, Edit, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CategoryBadge } from '@/components/kb/category-badge'
import { TagList } from '@/components/kb/tag-badge'
import { BreadcrumbNav } from '@/components/kb/breadcrumb-nav'
import { FeedbackSection } from '@/components/kb/feedback-section'
import { RelatedArticles } from '@/components/kb/related-articles'
import { TableOfContents } from '@/components/kb/table-of-contents'
import type { KnowledgeArticle, ArticleVote } from '@/lib/types/knowledge-base'

interface KBArticleClientProps {
  article: KnowledgeArticle & {
    author: {
      full_name: string
      avatar_url?: string | null
    }
    helpful_votes: number
    total_votes: number
  }
  relatedArticles: Partial<KnowledgeArticle>[]
  userVote?: ArticleVote | null
  canEdit: boolean
  sanitizedContent: string
  publishedDate: string
}

export function KBArticleClient({
  article,
  relatedArticles,
  userVote,
  canEdit,
  sanitizedContent,
  publishedDate
}: KBArticleClientProps) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Entrance animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 20
      }
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary origin-left z-50"
        style={{ scaleX }}
      />

      {/* Enhanced Header Background */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/90 to-background" />
        
        {/* Animated Glow Blobs */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[130px] rounded-full mix-blend-screen" 
        />
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-blue-400/10 blur-[100px] rounded-full mix-blend-screen" 
        />
      </div>

      <motion.div 
        className="container mx-auto py-8 md:py-12 px-4 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Breadcrumb */}
        <motion.div variants={itemVariants} className="mb-8 md:mb-12">
          <BreadcrumbNav
            items={[
              { label: 'Knowledge Base', href: '/kb' },
              { label: article.category, href: `/kb?category=${encodeURIComponent(article.category)}` },
              { label: article.title }
            ]}
          />
        </motion.div>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 xl:gap-14">
          {/* Main Content */}
          <main className="min-w-0">
            {/* Article Header */}
            <motion.header variants={itemVariants} className="space-y-6 mb-10">
              {/* Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <CategoryBadge category={article.category} subcategory={article.subcategory} />
                {article.status !== 'published' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    {article.status}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
                {article.title}
              </h1>

              {/* Meta Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 pt-2 border-b border-border/40 pb-8">
                <div className="flex flex-wrap items-center gap-6">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                      {article.author.avatar_url && (
                        <Image
                          src={article.author.avatar_url}
                          alt={article.author.full_name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {article.author.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">{article.author.full_name}</span>
                      <span className="text-xs text-muted-foreground">Author</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-border/40 hidden sm:block" />

                  {/* Date & Views */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{publishedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{article.view_count.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-background/50 hover:bg-background/80"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  {canEdit && (
                    <Button 
                      size="sm" 
                      asChild 
                      className="gap-2 bg-primary/90 hover:bg-primary"
                    >
                      <Link href={`/kb/${article.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary Box */}
              {article.summary && (
                <div className="relative mt-6 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/0 to-primary/5 rounded-xl blur transition-opacity opacity-50 group-hover:opacity-100" />
                  <div className="relative bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-5 md:p-6">
                    <p className="text-lg text-muted-foreground leading-relaxed font-serif italic">
                      &ldquo;{article.summary}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="pt-2">
                  <TagList tags={article.tags} maxDisplay={10} />
                </div>
              )}
            </motion.header>

            {/* Mobile TOC */}
            <motion.div variants={itemVariants} className="lg:hidden mb-8">
              <TableOfContents content={sanitizedContent} />
            </motion.div>

            {/* Content */}
            <motion.article
              variants={itemVariants}
              className="prose prose-lg prose-slate dark:prose-invert max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/30
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:leading-relaxed prose-p:text-muted-foreground/90
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors
                prose-strong:text-foreground prose-strong:font-semibold
                prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-border/20 prose-img:my-8
                prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-medium prose-code:text-primary prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border/10 prose-pre:rounded-xl prose-pre:shadow-2xl
                prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-muted/10 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                prose-ul:my-6 prose-li:my-2 prose-li:marker:text-primary/50
                mb-16"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            <motion.div variants={itemVariants}>
              <Separator className="my-10 bg-border/40" />
            </motion.div>

            {/* Feedback & Related */}
            <motion.div variants={itemVariants} className="space-y-16">
              {/* Feedback */}
              <div className="relative overflow-hidden w-full rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
                <div className="relative bg-card/30 backdrop-blur-md border border-border/40 p-8 md:p-10 text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Was this helpful?</h3>
                  <p className="text-muted-foreground mb-8 text-sm">Your feedback helps us improve the knowledge base</p>
                  <FeedbackSection
                    articleId={article.id}
                    helpfulVotes={article.helpful_votes}
                    totalVotes={article.total_votes}
                    userVote={userVote}
                  />
                </div>
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="h-8 w-1.5 bg-gradient-to-b from-primary to-blue-400 rounded-full" />
                    Related Articles
                  </h3>
                  <RelatedArticles articles={relatedArticles} />
                </div>
              )}
            </motion.div>
          </main>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <motion.div 
              variants={itemVariants}
              className="sticky top-24 space-y-8"
            >
              {/* TOC Card */}
              <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/40 p-5 shadow-sm transition-all hover:bg-card/60 hover:shadow-md">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2.5 text-foreground">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary))] animate-pulse" />
                  On this page
                </h4>
                <TableOfContents content={sanitizedContent} />
              </div>
            </motion.div>
          </aside>
        </div>
      </motion.div>
    </div>
  )
}
