/**
 * Tickets List Page
 *
 * Server Component that fetches and displays tickets based on user role.
 * - Employees see only their tickets
 * - Staff/Admin see all tickets or filtered by assignment
 * Includes status tabs, search, time filter, and page-based pagination.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketFilters } from '@/components/tickets/ticket-filters'
import { TicketList } from '@/components/tickets/ticket-list'
import { StatusTabs } from '@/components/tickets/status-tabs'
import { TimeFilter } from '@/components/tickets/time-filter'
import { createClient } from '@/lib/supabase/server'
import { getTicketsPaged } from '@/lib/tickets/queries'
import type { TicketFilters as TTicketFilters, TimePeriod } from '@/lib/types/tickets'
import type { TicketStatus } from '@/lib/types/database'
import { isStaffOrAbove } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants'

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    timePeriod?: string
    page?: string
  }>
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/sign-in')
  }

  // Get user profile with role
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, role, avatar_url')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    redirect('/auth/sign-in')
  }

  // Build filters based on role and query params
  const filters: TTicketFilters = {}

  // Role-based filtering
  if (!isStaffOrAbove(user.role)) {
    // Employees can only see their own tickets
    filters.user_id = user.id
  }
  // Staff and above can see all tickets (no user_id filter)

  // Apply URL query param filters
  if (params.status) {
    filters.status = params.status as TicketStatus
  }

  if (params.search) {
    filters.search = params.search
  }

  if (params.timePeriod) {
    filters.timePeriod = params.timePeriod as TimePeriod
  } else {
    // Default to 'this_week' if not specified
    filters.timePeriod = 'this_week'
  }

  // Parse page number
  const page = params.page ? parseInt(params.page, 10) : 1
  filters.page = page

  // Fetch tickets with page-based pagination
  const result = await getTicketsPaged(
    supabase,
    filters,
    PAGINATION.DEFAULT_PAGE_SIZE
  )

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          List of My Tickets
        </h1>
      </div>

      {/* Filter Bar: Search (left) + Time Filter (right) */}
      <div className="flex items-center justify-between gap-4">
        <Suspense fallback={<Skeleton className="h-10 w-full max-w-md" />}>
          <TicketFilters />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-10 w-[150px]" />}>
          <TimeFilter defaultValue="this_week" />
        </Suspense>
      </div>

      {/* Status Tabs */}
      <Suspense fallback={<Skeleton className="h-12 w-full" />}>
        <StatusTabs />
      </Suspense>

      {/* Ticket Count */}
      {result.totalCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {result.tickets.length} of {result.totalCount} ticket{result.totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Ticket List (Table) */}
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketList
          tickets={result.tickets}
          currentPage={result.currentPage}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
        />
      </Suspense>
    </div>
  )
}

/**
 * Loading skeleton for ticket list
 */
function TicketListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
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
        {/* Table rows skeleton */}
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
  )
}
