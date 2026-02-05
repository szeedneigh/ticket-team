import { Skeleton } from '@/components/ui/skeleton'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

function StaffQueueLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Stats Grid Skeleton - Matches 4 cards layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-2">
             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
             </div>
             <div className="space-y-1">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
             </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton - Matches Glassmorphic Card */}
      <div className="bg-background/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl shadow-[#1f3463]/5 overflow-hidden">
        
        {/* Toolbar Skeleton */}
        <div className="p-6 border-b border-white/5 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between bg-white/5">
           {/* Left: Search */}
           <div className="flex-1 max-w-md">
              <Skeleton className="h-10 w-full" />
           </div>
           
           {/* Right: Filter Buttons */}
           <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg border border-white/5 backdrop-blur-md overflow-hidden">
              <Skeleton className="h-8 w-8 rounded-md" /> {/* Filter Icon */}
              <div className="h-4 w-px bg-border mx-1" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
           </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="p-2 sm:p-6 bg-background/20">
           {/* Result info */}
           <div className="mb-4 flex items-center justify-between px-2">
              <Skeleton className="h-4 w-64" />
           </div>

           {/* Table (Inner Card) */}
           <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-xl shadow-[#1f3463]/5">
               {/* Header */}
               <div className="border-b border-white/10 bg-white/5 h-14 hidden md:flex items-center px-4">
                 <div className="flex w-full items-center">
                   <Skeleton className="h-4 w-[180px] mr-4" /> {/* Ticket No */}
                   <Skeleton className="h-4 min-w-[200px] flex-1 mr-4" /> {/* Concern */}
                   <Skeleton className="h-4 w-[160px] mr-4" /> {/* Category */}
                   <Skeleton className="h-4 w-[160px] mr-4" /> {/* Status */}
                   <Skeleton className="h-4 w-[140px] ml-auto" /> {/* Date */}
                 </div>
               </div>
               
               {/* Rows */}
               <div className="divide-y divide-white/5">
                 {[1, 2, 3, 4, 5].map((i) => (
                   <div key={i} className="p-5 hover:bg-white/5 transition-colors">
                     {/* Mobile View */}
                     <div className="md:hidden space-y-3">
                       <div className="flex justify-between items-start">
                         <div className="space-y-1.5">
                           <Skeleton className="h-3 w-20" /> {/* Ticket ID */}
                           <Skeleton className="h-5 w-48" /> {/* Title */}
                         </div>
                         <Skeleton className="h-6 w-20 rounded-full" /> {/* Status */}
                       </div>
                       <div className="flex justify-between items-center pt-2 border-t border-white/5">
                         <div className="flex items-center gap-2">
                            <Skeleton className="h-2 w-2 rounded-full" />
                            <Skeleton className="h-4 w-24" /> {/* Category */}
                         </div>
                         <Skeleton className="h-4 w-24" /> {/* Date */}
                       </div>
                     </div>

                     {/* Desktop View */}
                     <div className="hidden md:flex items-center w-full">
                       <div className="w-[180px] mr-4">
                         <Skeleton className="h-6 w-32 rounded-md bg-white/5" />
                       </div>
                       <div className="flex-1 min-w-[200px] mr-4">
                         <Skeleton className="h-5 w-[80%]" />
                       </div>
                       <div className="w-[160px] mr-4">
                         <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
                       </div>
                       <div className="w-[160px] mr-4">
                         <Skeleton className="h-6 w-20 rounded-full" />
                       </div>
                       <div className="w-[140px] ml-auto flex justify-end">
                         <Skeleton className="h-4 w-24" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffQueueLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/tickets/queue`}>
      <StaffQueueLoadingSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
