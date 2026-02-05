/**
 * KB Article Detail Loading State
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function ArticleDetailLoadingSkeleton() {
  return (
    <div className="min-h-full bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Enhanced Header Background */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/90 to-background" />

        {/* Animated Glow Blobs (Static for skeleton) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[130px] rounded-full mix-blend-screen" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-blue-400/10 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="container mx-auto py-8 md:py-12 px-4 max-w-7xl">
        {/* Breadcrumb skeleton - Individual items */}
        <div className="flex items-center gap-2 mb-8 md:mb-12">
          <Skeleton className="h-4 w-12" /> {/* Home */}
          <div className="h-4 w-4 flex items-center justify-center"><Skeleton className="h-3 w-3 rounded-full opacity-50" /></div>
          <Skeleton className="h-4 w-24" /> {/* KB */}
          <div className="h-4 w-4 flex items-center justify-center"><Skeleton className="h-3 w-3 rounded-full opacity-50" /></div>
          <Skeleton className="h-4 w-32" /> {/* Current Article */}
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 xl:gap-14">
          {/* Main Content */}
          <main className="min-w-0">
            {/* Article Header */}
            <header className="space-y-6 mb-10">
              {/* Badges */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Title */}
              <div className="space-y-3">
                <Skeleton className="h-10 sm:h-12 md:h-14 w-full" />
                <Skeleton className="h-10 sm:h-12 md:h-14 w-3/4" />
              </div>

              {/* Meta Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 pt-2 border-b border-border/40 pb-8">
                <div className="flex flex-wrap items-center gap-6">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>

                  <div className="h-8 w-px bg-border/40 hidden sm:block" />

                  {/* Date & Views */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-20 rounded-md" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              </div>

              {/* Summary Box */}
              <div className="relative mt-6">
                <div className="relative bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-5 md:p-6 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-11/12" />
                </div>
              </div>

              {/* Tags */}
              <div className="pt-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </header>

            {/* Mobile TOC skeleton */}
            <div className="lg:hidden mb-8">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Content skeleton - mimicking prose */}
            <div className="space-y-6 mb-16">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-full" />
              
              {/* Heading H2 */}
              <Skeleton className="h-8 w-1/2 mt-12 mb-6" />
              
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-10/12" />
              
              {/* Image */}
              <Skeleton className="w-full h-[300px] rounded-xl my-8" />
              
              {/* Heading H3 */}
              <Skeleton className="h-7 w-1/3 mt-8 mb-4" />
              
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-3/4" />
            </div>

            <Separator className="my-10 bg-border/40" />

            {/* Feedback & Related */}
            <div className="space-y-16">
              {/* Feedback Section */}
              <div className="relative overflow-hidden w-full rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-50" />
                <div className="relative bg-card/30 backdrop-blur-md border border-border/40 p-8 md:p-10 space-y-6">
                  <div className="text-center space-y-3 mb-6">
                    <Skeleton className="h-7 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                  </div>
                  {/* Buttons */}
                  <div className="flex justify-center gap-4">
                     <Skeleton className="h-12 w-[180px] rounded-md" /> {/* Helpful Button */}
                     <Skeleton className="h-12 w-[180px] rounded-md" /> {/* Not Helpful Button */}
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-8 w-1.5 rounded-full" />
                  <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-3">
                       {/* 1. Category Badge */}
                       <div className="flex gap-2">
                          <Skeleton className="h-5 w-24 rounded-full" />
                       </div>
                       
                       {/* 2. Title - 2 lines */}
                       <div className="space-y-1.5 pt-1">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-3/4" />
                       </div>

                       {/* 3. Summary - 2 lines */}
                       <div className="space-y-1.5 pt-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                       </div>

                       {/* 4. Metadata Row */}
                       <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-4">
                             <Skeleton className="h-3 w-12" />
                             <Skeleton className="h-3 w-12" />
                          </div>
                          <Skeleton className="h-3 w-20" /> {/* Read more */}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/40 p-5 shadow-sm space-y-4">
                {/* Header "On this page" */}
                <div className="flex items-center gap-2.5 mb-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {/* List items mimicking buttons */}
                <div className="space-y-1">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-11/12 rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-9/12 ml-3 rounded-md" /> {/* Nested */}
                  <Skeleton className="h-8 w-10/12 ml-3 rounded-md" /> {/* Nested */}
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function ArticleDetailLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/kb/article`}>
      <ArticleDetailLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
