/**
 * Admin Tickets Page
 *
 * Dedicated page for admins to view ALL tickets without default time filter restrictions.
 * - Shows all tickets by default (no time filter)
 * - Admin and super_admin only
 * - Same UI as regular tickets page but with 'all' time filter default
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
import { isAdmin } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'All Tickets | Admin | Ticket Team',
  description: 'View and manage all support tickets',
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    timePeriod?: string
    page?: string
  }>
}

export default async function AdminTicketsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Parallelize: Get authenticated user info and prepare for data fetching
  const [authResult, userResult] = await Promise.all([
    supabase.auth.getUser(),
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return null
      return supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', authUser.id)
        .single()
    })()
  ])

  const { data: { user: authUser } } = authResult

  if (!authUser) {
    redirect('/auth/sign-in')
  }

  const { data: user, error: userError } = userResult || {}

  if (userError || !user) {
    redirect('/auth/sign-in')
  }

  // Only admins can access this page
  if (!isAdmin(user.role)) {
    redirect('/tickets')
  }

  // Build filters - admins see ALL tickets (no user_id filter)
  const filters: TTicketFilters = {}

  // Apply URL query param filters
  if (params.status) {
    filters.status = params.status as TicketStatus
  }

  if (params.search) {
    filters.search = params.search
  }

  // Default to 'all' for admin view (no time restriction)
  if (params.timePeriod) {
    filters.timePeriod = params.timePeriod as TimePeriod
  } else {
    filters.timePeriod = 'all'
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
    <div className="min-h-full bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Header Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                All Tickets
              </h1>
              <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 max-w-2xl">
                View and manage all support tickets across the system.
                <Sparkles className="h-4 w-4 text-[#2cafdd]" />
              </p>
            </div>
          </div>

          {/* Controls Section - Integrated into Hero */}
          <div className="flex flex-col gap-6 bg-background/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-[#1f3463]/5">
            {/* Top Bar: Tabs & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <Suspense fallback={<Skeleton className="h-12 w-full md:w-auto min-w-[400px]" />}>
                <StatusTabs />
              </Suspense>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <Suspense fallback={<Skeleton className="h-10 w-[150px]" />}>
                  <TimeFilter defaultValue="all" />
                </Suspense>
              </div>
            </div>

            {/* Search Bar */}
            <div className="w-full">
              <Suspense fallback={<Skeleton className="h-10 w-full max-w-md" />}>
                <TicketFilters className="max-w-md" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Ticket Count */}
        {result.totalCount > 0 && (
          <div className="flex items-center justify-between px-1 mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{result.tickets.length}</span> of <span className="text-foreground font-semibold">{result.totalCount}</span> tickets
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
