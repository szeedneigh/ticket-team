'use client'

import { motion, useScroll, useSpring, Variants } from 'framer-motion'
import { Share2, Edit, Calendar, Eye, Clock, Bookmark } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CategoryBadge } from '@/components/kb/category-badge'
import { TagList } from '@/components/kb/tag-badge'
import { FeedbackSection } from '@/components/kb/feedback-section'
import { RelatedArticles } from '@/components/kb/related-articles'
import { TableOfContents } from '@/components/kb/table-of-contents'
import type { KnowledgeArticle, ArticleVote } from '@/lib/types/knowledge-base'
import { cn } from '@/lib/utils'

interface KBArticleClientProps {
  article: KnowledgeArticle & {
    author: {
      full_name: string
      avatar_url?: string | null
    } | null
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

  // Estimation of reading time (avg 200 words/min)
  const readingTime = Math.max(1, Math.ceil(sanitizedContent.replace(/<[^>]+>/g, '').split(/\s+/).length / 200))

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
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
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary pb-20">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary origin-left z-50 shadow-[0_1px_4px_rgba(var(--primary),0.3)]"
        style={{ scaleX }}
      />

      {/* Enhanced Ambient Background */}
      <div className="absolute top-0 inset-x-0 h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_80%,transparent_100%)] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/80 to-background" />
        
        {/* Animated Glow Blobs */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full mix-blend-plus-lighter" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 0.5, scale: 1, x: 0 }}
          transition={{ duration: 2.5, delay: 0.2 }}
          className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full mix-blend-plus-lighter" 
        />
      </div>

      <motion.div 
        className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-12 md:pt-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12 xl:gap-20">
          {/* Main Content */}
          <main className="min-w-0">
            {/* Article Header */}
            <motion.header variants={itemVariants} className="space-y-8 mb-12">
              {/* Top Row: Category & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryBadge category={article.category} subcategory={article.subcategory} className="text-sm px-3 py-1" />
                  {article.status !== 'published' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                      {article.status}
                    </span>
                  )}
                </div>
                
                {canEdit && (
                   <Button 
                    size="sm" 
                    variant="ghost"
                    asChild 
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Link href={`/kb/${article.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      Edit Article
                    </Link>
                  </Button>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
                {article.title}
              </h1>

              {/* Summary / Subtitle */}
              {article.summary && (
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance font-light border-l-4 border-primary/30 pl-6 py-1">
                  {article.summary}
                </p>
              )}

              {/* Author & Meta Grid */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-border/40">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                    {article.author?.avatar_url && (
                      <Image
                        src={article.author.avatar_url}
                        alt={article.author.full_name ?? 'Author'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                      {article.author?.full_name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{article.author?.full_name ?? 'Unknown Author'}</span>
                    <span className="text-xs text-muted-foreground">Technical Writer</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2" title={`Published on ${publishedDate}`}>
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span>{publishedDate}</span>
                    </div>
                    <div className="flex items-center gap-2" title={`${readingTime} min read`}>
                      <Clock className="h-4 w-4 text-primary/70" />
                      <span>{readingTime} min read</span>
                    </div>
                    <div className="flex items-center gap-2" title={`${article.view_count.toLocaleString()} views`}>
                      <Eye className="h-4 w-4 text-primary/70" />
                      <span>{article.view_count.toLocaleString()}</span>
                    </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-3 pt-2">
                 <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full px-4 h-9 bg-background/50 hover:bg-background/80 border-border/60 shadow-sm transition-all hover:scale-105 active:scale-95"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full px-4 h-9 bg-background/50 hover:bg-background/80 border-border/60 shadow-sm transition-all hover:scale-105 active:scale-95"
                    disabled
                  >
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
              </div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="pt-2">
                  <TagList tags={article.tags} maxDisplay={10} className="justify-start" />
                </div>
              )}
            </motion.header>

            {/* Mobile TOC */}
            <motion.div variants={itemVariants} className="lg:hidden mb-10">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                 <span className="font-semibold mb-2 block">Table of Contents</span>
                 <TableOfContents content={sanitizedContent} />
              </div>
            </motion.div>

            {/* Content */}
            <motion.article
              variants={itemVariants}
              className={cn(
                "prose prose-lg prose-slate dark:prose-invert max-w-none",
                "prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-32",
                "prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/30",
                "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4",
                "prose-p:leading-8 prose-p:text-muted-foreground/90 prose-p:my-6",
                "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors",
                "prose-strong:text-foreground prose-strong:font-bold",
                "prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-border/20 prose-img:my-10",
                // Enhanced Code Block Styling
                "prose-code:bg-muted/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:text-primary prose-code:before:content-none prose-code:after:content-none",
                "prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border/10 prose-pre:rounded-xl prose-pre:shadow-2xl prose-pre:p-6",
                // Enhanced Blockquote
                "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:pl-8 prose-blockquote:pr-6 prose-blockquote:py-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-muted-foreground shadow-sm",
                "prose-ul:my-6 prose-li:my-3 prose-li:marker:text-primary/70 prose-li:pl-2",
                "mb-20"
              )}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            <motion.div variants={itemVariants}>
              <Separator className="my-12 bg-border/40" />
            </motion.div>

            {/* Feedback & Related */}
            <motion.div variants={itemVariants} className="space-y-16">
              {/* Feedback Component */}
              <div className="relative overflow-hidden w-full rounded-2xl bg-card border border-border/50 shadow-sm group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 transition-all group-hover:from-primary/10" />
                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left space-y-2 max-w-md">
                    <h3 className="text-xl font-bold text-foreground">Was this article helpful?</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Your feedback helps us improve the quality of our documentation. 
                      Let us know if you found what you were looking for.
                    </p>
                  </div>
                  <div className="shrink-0 bg-background/50 backdrop-blur-sm rounded-xl p-2 border border-border/20 shadow-inner">
                    <FeedbackSection
                      articleId={article.id}
                      helpfulVotes={article.helpful_votes}
                      totalVotes={article.total_votes}
                      userVote={userVote}
                    />
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                       <Bookmark className="w-5 h-5" />
                    </span>
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
              className="sticky top-28 space-y-8"
            >
              {/* Desktop TOC */}
              <div className="bg-card/30 backdrop-blur-md rounded-2xl border border-border/40 p-6 shadow-sm transition-all hover:bg-card/50 hover:shadow-md hover:border-border/60">
                <h4 className="font-semibold text-sm mb-5 flex items-center gap-2.5 text-foreground uppercase tracking-wider opacity-90">
                  <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary))] animate-pulse" />
                  Contents
                </h4>
                <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                   <TableOfContents content={sanitizedContent} />
                </div>
              </div>
              
              {/* Optional: Promotion or Help Widget could go here */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                  <h4 className="font-bold text-lg mb-2 relative">Need more help?</h4>
                  <p className="text-blue-100 text-sm mb-4 relative z-10">Our support team is available 24/7 to assist you with any questions.</p>
                  <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                      Contact Support
                  </Button>
              </div>

            </motion.div>
          </aside>
        </div>
      </motion.div>
    </div>
  )
}
