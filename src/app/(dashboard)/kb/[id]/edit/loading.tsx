/**
 * Loading skeleton for KB article edit page
 * Matches the edit page layout: hero + form area (no Card wrapper).
 */

import { Skeleton } from '@/components/ui/skeleton'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function EditArticleLoadingSkeleton() {
  return (
    <div className="min-h-full bg-background relative">
      {/* Hero Section - matches edit page.tsx */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-12 pb-6 px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-40 md:w-48" />
          </div>
          <p className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-48" />
          </p>
        </div>
      </div>

      {/* Form content - matches KBEditorForm structure and edit page container */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Content editor */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="rounded-md border p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}

export default function EditArticleLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/kb/edit`}>
      <EditArticleLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
