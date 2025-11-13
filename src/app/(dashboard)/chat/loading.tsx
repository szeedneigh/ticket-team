/**
 * Chat Page Loading State
 *
 * Displays loading skeleton while chat page is loading
 *
 * @module app/(dashboard)/chat/loading
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <div className="flex h-full">
      {/* Sidebar Skeleton */}
      <div className="hidden w-80 flex-col border-r border-border md:flex">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Sessions */}
        <div className="space-y-2 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Area Skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 space-y-6 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-4xl">
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
