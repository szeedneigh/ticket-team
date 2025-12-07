/**
 * Knowledge Base Browse Page
 *
 * Server Component that displays published KB articles with search and filtering.
 * Includes empty state for when no articles exist.
 */

import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getArticles, getCategories, getAllTags } from '@/lib/kb/queries'
import { isStaffOrAbove } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '@/components/ui/empty'
import { KBBrowseClientWrapper } from '@/components/kb/kb-browse-client-wrapper'

interface PageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    page?: string
    sort?: 'recent' | 'popular' | 'helpful'
    tags?: string
  }>
}

// ISR for KB browse - revalidate every 30 minutes
export const revalidate = 1800 // 30 minutes

export default async function KBBrowsePage({ searchParams }: PageProps) {
  const params = await searchParams
  const user = await requireAuth()

  // Parse filters from URL
  const filters = {
    category: params.category,
    search: params.search,
    tags: params.tags?.split(',').filter(Boolean),
    status: 'published' as const
  }

  const page = params.page ? parseInt(params.page, 10) : 1
  const sortBy = params.sort || 'recent'

  // Fetch articles with sorting
  const { articles, total, per_page } = await getArticles(filters, page, 20, sortBy)

  // Fetch categories and tags for filters
  const [categoriesData, allTagsData] = await Promise.all([
    getCategories(),
    getAllTags()
  ])

  // Serialize all data to ensure they're JSON-safe for client components
  const categories = JSON.parse(JSON.stringify(categoriesData))
  const allTags = JSON.parse(JSON.stringify(allTagsData))

  const serializedArticles = articles.map(article => ({
    id: article.id,
    title: article.title,
    content: article.content,
    summary: article.summary,
    category: article.category,
    subcategory: article.subcategory,
    tags: article.tags,
    author_id: article.author_id,
    status: article.status,
    view_count: article.view_count,
    helpful_votes: article.helpful_votes,
    total_votes: article.total_votes,
    embedding: article.embedding,
    source_ticket_id: article.source_ticket_id,
    created_at: article.created_at,
    updated_at: article.updated_at,
    published_at: article.published_at,
    author: {
      id: article.author.id,
      full_name: article.author.full_name,
      email: article.author.email,
      avatar_url: article.author.avatar_url
    }
  }))

  // Check if user can create articles
  const canCreate = isStaffOrAbove(user.role)

  // Calculate total pages
  const totalPages = Math.ceil(total / per_page)

  // Check if has active search/filters
  const hasFilters = filters.category || filters.search || (filters.tags && filters.tags.length > 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto py-20 md:py-32 px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                Knowledge Base
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Everything you need to know about using the platform. Find answers, guides, and best practices.
              </p>
            </div>
            
            {/* Search is now part of the hero */}
            <div className="pt-4 max-w-2xl mx-auto">
               {/* Client Wrapper handles the search state */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col gap-8">
          {/* Action Bar */}
          {canCreate && (
            <div className="flex justify-end">
              <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                <Link href="/kb/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Link>
              </Button>
            </div>
          )}

          {/* Client Wrapper for Search and Results */}
          {total === 0 && !hasFilters ? (
            <Empty className="border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 p-12">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-muted/50 p-4 rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="text-xl font-semibold">No Articles Yet</EmptyTitle>
                <EmptyDescription className="text-muted-foreground max-w-md mx-auto mt-2">
                  {canCreate
                    ? "Get started by creating your first knowledge base article."
                    : "Knowledge base articles will appear here once they're published."}
                </EmptyDescription>
              </EmptyHeader>
              {canCreate && (
                <EmptyContent className="mt-6">
                  <Button asChild>
                    <Link href="/kb/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Article
                    </Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <KBBrowseClientWrapper
              defaultSearch={params.search}
              categories={categories}
              allTags={allTags}
              serverArticles={serializedArticles}
              total={total}
              perPage={per_page}
              currentPage={page}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  )
}
