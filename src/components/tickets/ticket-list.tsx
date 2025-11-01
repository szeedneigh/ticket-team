/**
 * Ticket List Component
 *
 * Client component for displaying ticket list with pagination controls.
 * Maps ticket data to TicketCard components, handles empty states, and loading.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { TicketCard } from './ticket-card'
import type { TicketWithUser } from '@/lib/types/tickets'
import { cn } from '@/lib/utils'

interface TicketListProps {
  tickets: TicketWithUser[]
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
  className?: string
}

export function TicketList({
  tickets,
  nextCursor,
  prevCursor,
  hasMore,
  className,
}: TicketListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  /**
   * Navigate to next/previous page
   */
  const navigatePage = (cursor: string | null, direction: 'next' | 'prev') => {
    if (!cursor) return

    const params = new URLSearchParams(searchParams.toString())

    if (direction === 'next') {
      params.set('cursor', cursor)
      params.delete('prev')
    } else {
      params.set('prev', cursor)
      params.delete('cursor')
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Empty state
  if (tickets.length === 0 && !isPending) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl">🎫</div>
          <div>
            <h3 className="text-lg font-semibold">No tickets found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchParams.toString()
                ? 'Try adjusting your filters or search query'
                : 'Create your first ticket to get started'}
            </p>
          </div>
          {!searchParams.toString() && (
            <Button
              onClick={() => router.push('/tickets/new')}
              className="mt-2"
            >
              Create Ticket
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Ticket Cards */}
      <div className="grid gap-4">
        {isPending ? (
          // Loading skeleton
          <>
            <TicketCardSkeleton />
            <TicketCardSkeleton />
            <TicketCardSkeleton />
          </>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {(prevCursor || hasMore) && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => navigatePage(prevCursor, 'prev')}
            disabled={!prevCursor || isPending}
          >
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            {hasMore && ' (more available)'}
          </div>

          <Button
            variant="outline"
            onClick={() => navigatePage(nextCursor, 'next')}
            disabled={!hasMore || isPending}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Loading skeleton for ticket cards
 */
function TicketCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Category */}
        <Skeleton className="h-4 w-48" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </Card>
  )
}
