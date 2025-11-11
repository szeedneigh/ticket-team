/**
 * KB Article Detail Loading State
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function ArticleDetailLoading() {
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Mobile TOC skeleton */}
      <div className="lg:hidden mb-6">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-8">
        {/* Main Content */}
        <div>
          {/* Header skeleton */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-1" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>

          <Separator className="my-8" />

          {/* Content skeleton */}
          <div className="space-y-4 mb-12">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="my-6">
              <Skeleton className="h-6 w-2/3" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="my-6">
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>

          <Separator className="my-8" />

          {/* Feedback section skeleton */}
          <div className="p-6 rounded-lg border border-border space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Related articles skeleton */}
          <div className="mt-12 space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop TOC Sidebar skeleton */}
        <aside className="hidden lg:block sticky top-24 self-start">
          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5 ml-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 ml-4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
