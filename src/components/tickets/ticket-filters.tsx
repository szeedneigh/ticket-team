/**
 * Ticket Filters Component
 *
 * Search input with debounce for filtering tickets.
 * Status filtering moved to tabs, time filtering to separate component.
 */

'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (searchParams.get('search') || '')) {
        const params = new URLSearchParams(searchParams.toString())

        if (searchQuery.trim() === '') {
          params.delete('search')
        } else {
          params.set('search', searchQuery)
        }

        // Reset to page 1 when search changes
        params.delete('page')

        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`)
        })
      }
    }, SEARCH.DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [searchQuery, searchParams, pathname, router])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        placeholder="Search for ticket"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 w-full max-w-md"
        disabled={isPending}
        aria-label="Search tickets by number or concern"
        aria-describedby={isPending ? "search-status" : undefined}
      />
      {isPending && (
        <span id="search-status" className="sr-only">
          Searching tickets...
        </span>
      )}
    </div>
  )
}
