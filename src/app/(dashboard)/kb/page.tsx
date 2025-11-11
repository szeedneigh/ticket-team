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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Find answers and helpful articles
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/kb/new">
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Link>
          </Button>
        )}
      </div>

      {/* Client Wrapper for Search and Results */}
      {total === 0 && !hasFilters ? (
        <Empty className="border-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No Articles Yet</EmptyTitle>
            <EmptyDescription>
              {canCreate
                ? "Get started by creating your first knowledge base article."
                : "Knowledge base articles will appear here once they're published."}
            </EmptyDescription>
          </EmptyHeader>
          {canCreate && (
            <EmptyContent>
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
  )
}
