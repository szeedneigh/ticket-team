/**
 * Loading state for FAQ page
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader } from '@/components/ui/card'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function FAQLoadingSkeleton() {
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

      {/* FAQ Sections Skeleton */}
      {[1, 2, 3, 4].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FAQLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/help/faq`}>
      <FAQLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
