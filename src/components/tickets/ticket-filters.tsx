/**
 * Ticket Filters Component
 *
 * Filter controls for ticket list: status, priority, search with debounce,
 * and page size selector. Updates URL params for shareable state.
 */

'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/types/database'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants/pagination'
import { SEARCH } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TicketFiltersProps {
  className?: string
}

export function TicketFilters({ className }: TicketFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for search input (for debouncing)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  // Get current filter values from URL
  const currentStatus = searchParams.get('status') as TicketStatus | null
  const currentPriority = searchParams.get('priority') as TicketPriority | null
  const currentPageSize = searchParams.get('limit') || String(PAGINATION.DEFAULT_PAGE_SIZE)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (searchParams.get('search') || '')) {
        updateFilters({ search: searchQuery || undefined })
      }
    }, SEARCH.DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [searchQuery, searchParams])

  /**
   * Update URL search params with new filters
   */
  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      // Reset cursor when filters change
      if (Object.keys(updates).some(key => key !== 'cursor')) {
        params.delete('cursor')
      }

      // Navigate with new params
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    startTransition(() => {
      router.push(pathname)
    })
  }, [pathname, router])

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    currentStatus || currentPriority || searchQuery.trim().length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search tickets by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            disabled={isPending}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <Select
          value={currentStatus || 'all'}
          onValueChange={(value) =>
            updateFilters({ status: value === 'all' ? undefined : value })
          }
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={currentPriority || 'all'}
          onValueChange={(value) =>
            updateFilters({ priority: value === 'all' ? undefined : value })
          }
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Page Size Selector */}
        <Select
          value={currentPageSize}
          onValueChange={(value) => updateFilters({ limit: value })}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Page Size" />
          </SelectTrigger>
          <SelectContent>
            {PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="text-sm text-muted-foreground">
          Updating filters...
        </div>
      )}
    </div>
  )
}
