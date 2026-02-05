/**
 * Loading state for System Settings page
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function SettingsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Content Cards */}
      <div className="mt-2 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/admin/settings`}>
      <SettingsLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
