/**
 * Ticket List Component
 *
 * Client component for displaying ticket list with table view and numbered pagination.
 * Uses TicketTable component for display, handles empty states, and loading.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { TicketTable } from './ticket-table'
import type { TicketWithUser } from '@/lib/types/tickets'
import { cn } from '@/lib/utils'

interface TicketListProps {
  tickets: TicketWithUser[]
  currentPage: number
  totalPages: number
  totalCount: number
  className?: string
}

export function TicketList({
  tickets,
  currentPage,
  totalPages,
  totalCount,
  className,
}: TicketListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  /**
   * Navigate to specific page
   */
  const navigateToPage = (page: number) => {
    if (page < 1 || page > totalPages) return

    const params = new URLSearchParams(searchParams.toString())

    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  /**
   * Generate page numbers to display (memoized for performance)
   * Shows: 1, 2, 3 when few pages
   * Shows: 1, ..., 5, 6, 7, ..., 10 when many pages
   */
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...')
      }

      // Add pages around current
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }, [currentPage, totalPages])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Ticket Table */}
      <TicketTable tickets={tickets} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Pagination" role="navigation">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
            className="h-9 px-4"
            aria-label="Go to previous page"
          >
            Previous
          </Button>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">
                  ...
                </span>
              )
            }

            const pageNumber = page as number
            const isActive = pageNumber === currentPage

            return (
              <Button
                key={pageNumber}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => navigateToPage(pageNumber)}
                disabled={isPending}
                className={cn(
                  'h-9 w-9 p-0',
                  isActive && 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
                aria-label={`${isActive ? 'Current page, ' : ''}Page ${pageNumber}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNumber}
              </Button>
            )
          })}

          {/* Next Button */}
          <Button
            variant="outline"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isPending}
            className="h-9 px-4"
            aria-label="Go to next page"
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
