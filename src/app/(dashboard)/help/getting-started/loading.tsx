/**
 * Loading state for Getting Started page
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function GettingStartedLoadingSkeleton() {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Back Button Skeleton */}
      <Skeleton className="h-9 w-32" />

      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
      </div>

      {/* Steps Skeleton */}
      {[1, 2, 3, 4, 5, 6, 7].map((step) => (
        <div key={step} className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

export default function GettingStartedLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/help/getting-started`}>
      <GettingStartedLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
