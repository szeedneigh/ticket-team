/**
 * Loading state for Tickets List page
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function TicketsLoading() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Status Tabs */}
      <Skeleton className="h-12 w-full" />

      {/* Ticket List Table Skeleton */}
      <div className="space-y-4">
        <div className="rounded-lg border">
          <div className="border-b bg-muted/50 p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-[160px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b p-4 last:border-b-0">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
