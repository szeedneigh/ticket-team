/**
 * Loading state for Tickets List page
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function TicketsLoading() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
       {/* Hero Section with Skeleton Background - Matches page.tsx */}
       <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Header Content Skeleton */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4 w-full">
               {/* Title */}
               <Skeleton className="h-10 md:h-16 w-64 bg-muted/20 backdrop-blur-sm" /> 
               {/* Description */}
               <Skeleton className="h-6 w-96 max-w-full bg-muted/10 backdrop-blur-sm" />
            </div>
          </div>

          {/* Controls Section Skeleton - Glassmorphic Card */}
          <div className="flex flex-col gap-6 bg-background/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-[#1f3463]/5">
            {/* Top Bar: Tabs & Time Filter */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
               {/* Status Tabs Skeleton */}
               <Skeleton className="h-12 w-full md:w-[500px] rounded-lg bg-muted/20" />
              
               {/* Time Filter Skeleton */}
               <div className="flex items-center gap-3 w-full md:w-auto">
                  <Skeleton className="h-10 w-[150px] rounded-md bg-muted/20" />
               </div>
            </div>

            {/* Search Bar Skeleton */}
            <div className="w-full">
               <Skeleton className="h-10 w-full max-w-md rounded-md bg-muted/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
         {/* Results Count Skeleton */}
         <div className="mb-4">
            <Skeleton className="h-4 w-40" />
         </div>

        {/* Ticket List Table Skeleton */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card">
            {/* Header */}
            <div className="border-b bg-muted/50 p-4">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-[20%] bg-muted/30" /> {/* Subject */}
                <Skeleton className="h-4 w-[15%] bg-muted/30" /> {/* Status */}
                <Skeleton className="h-4 w-[15%] bg-muted/30" /> {/* Priority */}
                <Skeleton className="h-4 w-[15%] bg-muted/30" /> {/* Assignee */}
                <Skeleton className="h-4 w-[15%] bg-muted/30" /> {/* Date */}
              </div>
            </div>
            {/* Rows */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b p-4 last:border-b-0 hover:bg-muted/5 transition-colors">
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  {/* Subject column (Badge + Text) */}
                  <div className="w-[20%] space-y-2">
                     <Skeleton className="h-5 w-16 bg-muted/40 rounded-full" />
                     <Skeleton className="h-4 w-40 bg-muted/30" />
                  </div>
                  
                  {/* Status */}
                  <div className="w-[15%]">
                     <Skeleton className="h-6 w-24 bg-muted/40 rounded-full" />
                  </div>

                  {/* Priority */}
                  <div className="w-[15%]">
                     <Skeleton className="h-5 w-20 bg-muted/30 rounded-md" />
                  </div>

                  {/* Assignee */}
                  <div className="w-[15%] flex items-center gap-2">
                     <Skeleton className="h-6 w-6 rounded-full bg-muted/40" />
                     <Skeleton className="h-4 w-24 bg-muted/30" />
                  </div>

                  {/* Date */}
                  <div className="w-[15%]">
                     <Skeleton className="h-4 w-24 bg-muted/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
