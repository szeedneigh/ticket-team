/**
 * New KB Article Page Loading State
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function NewArticleLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Editor Form */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Summary */}
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Content Editor */}
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-96 w-full" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </Card>

      {/* Auto-save indicator */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

export default function NewArticleLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/kb/new`}>
      <NewArticleLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}

