/**
 * Loading state for Help Center pages
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function HelpLoadingSkeleton() {
  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header Skeleton */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-96 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Quick Links Skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Topics Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HelpLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/help`}>
      <HelpLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
