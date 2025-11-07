/**
 * Knowledge Base Browse Page
 *
 * Server Component that displays published KB articles with search and filtering.
 * Includes empty state for when no articles exist.
 */

import Link from 'next/link'
import { BookOpen, Plus, Search } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getArticles } from '@/lib/kb/queries'
import { isStaffOrAbove } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '@/components/ui/empty'

interface PageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    page?: string
  }>
}

export default async function KBBrowsePage({ searchParams }: PageProps) {
  const params = await searchParams
  const user = await requireAuth()

  // Parse filters from URL
  const filters = {
    category: params.category,
    search: params.search,
    status: 'published' as const
  }

  const page = params.page ? parseInt(params.page, 10) : 1

  // Fetch articles
  const { articles, total } = await getArticles(filters, page, 20)

  // Check if user can create articles
  const canCreate = isStaffOrAbove(user.role)

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

      {/* Search Bar Placeholder */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search knowledge base..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled
        />
      </div>

      {/* Empty State */}
      {total === 0 ? (
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
        <>
          {/* Article Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {articles.length} of {total} article{total !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Article Grid (Placeholder) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {article.summary || 'No summary available'}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{article.category}</span>
                  <span>{article.view_count} views</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Loading skeleton for KB browse page
 */
function KBBrowsePageSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search bar skeleton */}
      <Skeleton className="h-12 w-full" />

      {/* Article grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 rounded-lg border border-border space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { KBBrowsePageSkeleton }
