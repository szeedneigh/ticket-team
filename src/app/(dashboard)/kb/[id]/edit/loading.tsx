/**
 * Loading skeleton for KB article edit page
 */

import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'

export default function EditArticleLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Edit Article" description="Loading..." />

      <div className="space-y-6">
        {/* Title field skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Summary field skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Category fields skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Tags field skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Editor skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="border rounded-md p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}
