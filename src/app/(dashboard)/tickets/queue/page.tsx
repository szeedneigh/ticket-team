/**
 * Staff Queue Page
 *
 * Server Component that displays all unassigned and open tickets for staff to manage.
 * Staff members can:
 * - View all unassigned tickets
 * - Filter by priority, category, and age
 * - Quickly assign tickets to themselves or other staff
 * - See queue statistics
 *
 * Access: Staff, Admin, Super Admin only
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Users, Clock, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TicketFilters } from '@/components/tickets/ticket-filters'
import { TicketList } from '@/components/tickets/ticket-list'
import { StatsCard } from '@/components/dashboard/stats-card'
import { createClient } from '@/lib/supabase/server'
import type { TicketFilters as TTicketFilters, TimePeriod } from '@/lib/types/tickets'
import type { TicketPriority } from '@/lib/types/database'
import { isStaffOrAbove } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants'

interface PageProps {
  searchParams: Promise<{
    priority?: string
    search?: string
    timePeriod?: string
    page?: string
  }>
}

export default async function StaffQueuePage({ searchParams }: PageProps) {
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

  // Check if user is staff or above
  if (!isStaffOrAbove(user.role)) {
    redirect('/tickets')
  }

  // Build filters for unassigned tickets
  const filters: TTicketFilters = {
    // Only show open and in_progress tickets that are unassigned
    status: ['open', 'in_progress'],
  }

  // Apply URL query param filters
  if (params.priority) {
    filters.priority = params.priority as TicketPriority
  }

  if (params.search) {
    filters.search = params.search
  }

  if (params.timePeriod) {
    filters.timePeriod = params.timePeriod as TimePeriod
  } else {
    // Default to 'all' for staff queue to show all unassigned tickets
    filters.timePeriod = 'all'
  }

  // Parse page number
  const page = params.page ? parseInt(params.page, 10) : 1
  filters.page = page

  // Fetch unassigned tickets
  // We need to add a filter for assigned_to IS NULL
  // Let's fetch all tickets and filter for unassigned in the query
  const { data: allTickets, error: ticketsError } = await supabase
    .from('tickets')
    .select(`
      *,
      user:users!tickets_user_id_fkey(id, full_name, email, avatar_url),
      assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url)
    `)
    .in('status', ['open', 'in_progress'])
    .is('assigned_to', null)
    .order('created_at', { ascending: false })

  if (ticketsError) {
    console.error('Error fetching queue tickets:', ticketsError)
  }

  const queueTickets = allTickets || []

  // Apply additional filters (priority, search, time period)
  let filteredTickets = queueTickets

  if (params.priority) {
    filteredTickets = filteredTickets.filter(t => t.priority === params.priority)
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filteredTickets = filteredTickets.filter(
      t =>
        t.title.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
    )
  }

  // Apply time period filter
  if (params.timePeriod && params.timePeriod !== 'all') {
    const now = new Date()
    let startDate: Date | null = null

    switch (params.timePeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'this_week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    if (startDate) {
      filteredTickets = filteredTickets.filter(
        t => new Date(t.created_at) >= startDate!
      )
    }
  }

  // Implement pagination
  const totalCount = filteredTickets.length
  const totalPages = Math.ceil(totalCount / PAGINATION.DEFAULT_PAGE_SIZE)
  const startIndex = (page - 1) * PAGINATION.DEFAULT_PAGE_SIZE
  const endIndex = startIndex + PAGINATION.DEFAULT_PAGE_SIZE
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  // Calculate queue statistics
  const highPriorityCount = queueTickets.filter(t => t.priority === 'high').length
  const mediumPriorityCount = queueTickets.filter(t => t.priority === 'medium').length
  const lowPriorityCount = queueTickets.filter(t => t.priority === 'low').length

  // Calculate oldest ticket age (in days)
  let oldestTicketDays = 0
  if (queueTickets.length > 0) {
    const oldestTicket = queueTickets.reduce((oldest, ticket) =>
      new Date(ticket.created_at) < new Date(oldest.created_at) ? ticket : oldest
    )
    const now = new Date()
    const ticketDate = new Date(oldestTicket.created_at)
    oldestTicketDays = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Queue</h1>
          <p className="text-muted-foreground mt-1">
            Unassigned tickets waiting for staff attention
          </p>
        </div>
        <Button asChild>
          <Link href="/tickets">View All Tickets</Link>
        </Button>
      </div>

      {/* Queue Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Unassigned Tickets"
          value={queueTickets.length}
          icon={Users}
          description="Waiting for assignment"
          trend={queueTickets.length > 10 ? 'up' : 'down'}
        />
        <StatsCard
          title="High Priority"
          value={highPriorityCount}
          icon={AlertCircle}
          description="Urgent attention needed"
          trend={highPriorityCount > 5 ? 'up' : 'down'}
          variant={highPriorityCount > 5 ? 'destructive' : 'default'}
        />
        <StatsCard
          title="Medium Priority"
          value={mediumPriorityCount}
          icon={TrendingUp}
          description="Normal priority"
          trend="neutral"
        />
        <StatsCard
          title="Oldest Ticket"
          value={oldestTicketDays}
          icon={Clock}
          description={oldestTicketDays === 1 ? 'day old' : 'days old'}
          trend={oldestTicketDays > 7 ? 'up' : 'down'}
          variant={oldestTicketDays > 7 ? 'warning' : 'default'}
        />
      </div>

      {/* Alert for high priority tickets */}
      {highPriorityCount > 5 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are {highPriorityCount} high-priority tickets in the queue that need immediate
            attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Alert for old tickets */}
      {oldestTicketDays > 7 && (
        <Alert variant="default">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            The oldest ticket has been waiting for {oldestTicketDays} days. Consider reviewing
            older tickets.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar: Search only (time filter less relevant for queue) */}
      <div className="flex items-center justify-between gap-4">
        <Suspense fallback={<Skeleton className="h-10 w-full max-w-md" />}>
          <TicketFilters />
        </Suspense>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Link href="/tickets/queue">
            <Button variant={!params.priority ? 'default' : 'outline'} size="sm">
              All
            </Button>
          </Link>
          <Link href="/tickets/queue?priority=high">
            <Button variant={params.priority === 'high' ? 'default' : 'outline'} size="sm">
              High ({highPriorityCount})
            </Button>
          </Link>
          <Link href="/tickets/queue?priority=medium">
            <Button variant={params.priority === 'medium' ? 'default' : 'outline'} size="sm">
              Medium ({mediumPriorityCount})
            </Button>
          </Link>
          <Link href="/tickets/queue?priority=low">
            <Button variant={params.priority === 'low' ? 'default' : 'outline'} size="sm">
              Low ({lowPriorityCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* Ticket Count */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedTickets.length} of {totalCount} unassigned ticket
            {totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Empty State */}
      {queueTickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No unassigned tickets</h3>
          <p className="text-muted-foreground mb-4">
            All tickets have been assigned. Great work!
          </p>
          <Button asChild>
            <Link href="/tickets">View All Tickets</Link>
          </Button>
        </div>
      )}

      {/* Ticket List (Table) */}
      {queueTickets.length > 0 && (
        <Suspense fallback={<TicketListSkeleton />}>
          <TicketList
            tickets={paginatedTickets}
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
          />
        </Suspense>
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
