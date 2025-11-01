/**
 * Tickets List Page
 *
 * Server Component that fetches and displays tickets based on user role.
 * - Employees see only their tickets
 * - Staff/Admin see all tickets or filtered by assignment
 * Includes filters, search, and cursor-based pagination.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketFilters } from '@/components/tickets/ticket-filters'
import { TicketList } from '@/components/tickets/ticket-list'
import { createClient } from '@/lib/supabase/server'
import { getTickets } from '@/lib/tickets/queries'
import type { TicketFilters as TTicketFilters } from '@/lib/tickets/queries'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'
import { isStaffOrAbove } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants/pagination'

interface PageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    search?: string
    cursor?: string
    prev?: string
    limit?: string
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

  if (params.priority) {
    filters.priority = params.priority as TicketPriority
  }

  if (params.search) {
    filters.search = params.search
  }

  // Parse pagination options
  const limit = params.limit
    ? Math.min(parseInt(params.limit, 10), PAGINATION.MAX_PAGE_SIZE)
    : PAGINATION.DEFAULT_PAGE_SIZE

  const cursor = params.cursor || undefined
  const prevCursor = params.prev || undefined

  // Fetch tickets
  const result = await getTickets(supabase, filters, {
    cursor: cursor || prevCursor,
    limit,
    order: prevCursor ? 'asc' : 'desc', // Reverse order when going back
    orderBy: 'created_at',
  })

  // Reverse items if going back (prev cursor)
  const tickets = prevCursor ? result.items.reverse() : result.items

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isStaffOrAbove(user.role) ? 'All Tickets' : 'My Tickets'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStaffOrAbove(user.role)
              ? 'View and manage support tickets'
              : 'Track your support requests'}
          </p>
        </div>

        <Link href="/tickets/new">
          <Button>
            Create Ticket
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <TicketFilters />
      </Suspense>

      {/* Ticket List */}
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketList
          tickets={tickets}
          nextCursor={prevCursor ? null : result.nextCursor}
          prevCursor={prevCursor ? result.prevCursor : null}
          hasMore={prevCursor ? false : result.hasMore}
        />
      </Suspense>

      {/* Staff-only: Link to Queue */}
      {isStaffOrAbove(user.role) && (
        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Staff Queue</h3>
              <p className="text-sm text-muted-foreground">
                Manage unassigned tickets and your assigned work
              </p>
            </div>
            <Link href="/tickets/queue">
              <Button variant="outline">
                View Queue
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Loading skeleton for ticket list
 */
function TicketListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  )
}
