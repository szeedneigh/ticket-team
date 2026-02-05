/**
 * Chat Page Loading State
 *
 * Displays loading skeleton only on the initial visit (per session).
 *
 * @module app/(dashboard)/analytics/chat/loading
 */

import { Skeleton } from '@/components/ui/skeleton'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function AnalyticsChatSkeleton() {
  return (
    <div className="flex h-full bg-background overflow-hidden relative">
      <div className="flex flex-1 flex-col relative h-full">
        <div className="flex-1 overflow-y-auto p-4 md:px-8 space-y-8">
          <div className="flex flex-col items-center justify-center h-[40%] space-y-4 opacity-50">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <Skeleton className="h-12 w-64 rounded-2xl rounded-tr-sm bg-muted/40" />
            </div>
          </div>
          <div className="flex gap-4 max-w-[80%]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 pb-6 md:pb-8">
          <div className="mx-auto w-full max-w-4xl">
            <Skeleton className="h-[60px] w-full rounded-xl bg-muted/30" />
          </div>
        </div>
      </div>
      <div className="hidden md:flex w-80 flex-col h-full border-l border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex flex-col gap-4 p-5 border-b border-border/50">
          <Skeleton className="h-7 w-24 bg-muted/40" />
          <Skeleton className="h-10 w-full rounded-md bg-muted/40" />
          <Skeleton className="h-10 w-full rounded-md bg-muted/20" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl border border-transparent space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32 bg-muted/40" />
                <Skeleton className="h-3 w-12 bg-muted/20" />
              </div>
              <Skeleton className="h-3 w-full bg-muted/20" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border/50">
          <Skeleton className="h-3 w-32 mx-auto bg-muted/30" />
        </div>
      </div>
    </div>
  )
}

export default function ChatLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/analytics/chat`}>
      <AnalyticsChatSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
