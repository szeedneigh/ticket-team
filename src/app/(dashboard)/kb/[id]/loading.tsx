/**
 * KB Article Detail Loading State
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Header Background */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/80 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      </div>
      
      <div className="container mx-auto py-8 md:py-12 px-4 max-w-7xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-8 md:mb-12">
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Mobile TOC skeleton */}
        <div className="lg:hidden mb-6">
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 xl:gap-14">
          {/* Main Content */}
          <main className="min-w-0">
            {/* Header skeleton */}
            <header className="space-y-6 mb-10">
              {/* Badges */}
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-3/4" />
              </div>
              
              {/* Author & Meta */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-px" />
                <div className="flex gap-6">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-card/50 border border-border/40 rounded-xl p-5">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6 mt-2" />
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </header>

            {/* Content skeleton */}
            <div className="space-y-4 mb-12">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <div className="my-8">
                <Skeleton className="h-7 w-2/3" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>

            <Separator className="my-10 bg-border/30" />

            {/* Feedback section skeleton */}
            <div className="bg-card/50 rounded-2xl p-6 md:p-8 border border-border/40">
              <div className="text-center space-y-3 mb-6">
                <Skeleton className="h-7 w-64 mx-auto" />
                <Skeleton className="h-4 w-80 mx-auto" />
              </div>
              <div className="flex justify-center gap-4">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-lg" />
              </div>
            </div>

            {/* Related articles skeleton */}
            <div className="mt-14 space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-3">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-4 pt-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Desktop TOC Sidebar skeleton */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-card/50 rounded-xl border border-border/40 p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-5 w-1 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-5/6 rounded-md" />
                  <Skeleton className="h-8 w-4/5 ml-3 rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-3/4 ml-3 rounded-md" />
                  <Skeleton className="h-8 w-5/6 rounded-md" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

