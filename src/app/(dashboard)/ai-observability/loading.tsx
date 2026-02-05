import { Skeleton } from '@/components/ui/skeleton'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function AIObservabilityLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 space-y-3"
          >
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AIObservabilityLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/ai-observability`}>
      <AIObservabilityLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}

