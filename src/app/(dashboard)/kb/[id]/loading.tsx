/**
 * KB Article Detail Loading State
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function ArticleDetailLoading() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Back button skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-4 mb-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-20 w-full" />
      </div>

      <Separator className="my-8" />

      {/* Content skeleton */}
      <div className="space-y-4 mb-12">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <Separator className="my-8" />

      {/* Feedback section skeleton */}
      <div className="p-6 rounded-lg border border-border space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Related articles skeleton */}
      <div className="mt-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}
