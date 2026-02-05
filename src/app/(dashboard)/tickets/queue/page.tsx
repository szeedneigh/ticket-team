import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TicketFilters as TTicketFilters, TimePeriod } from '@/lib/types/tickets'
import type { TicketPriority } from '@/lib/types/database'
import { isStaffOrAbove } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants'
import { getTicketsPaged } from '@/lib/tickets/queries'
import { QueuePageClient } from './queue-client'

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

  // Parallelize: Get authenticated user info
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

  // Check if user is staff or above
  if (!isStaffOrAbove(user.role)) {
    redirect('/tickets')
  }

  // Build filters for unassigned tickets
  const filters: TTicketFilters = {
    // Only show open and in_progress tickets that are unassigned
    status: ['open', 'in_progress'],
    assigned_to: null,
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

  // Fetch paged tickets (DB-level pagination to keep payload small)
  const paged = await getTicketsPaged(supabase, filters, PAGINATION.DEFAULT_PAGE_SIZE)

  // Fetch queue statistics (unfiltered by priority/search/time)
  const baseQueueQuery = () =>
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
      .is('assigned_to', null)

  const priorityCountQuery = (priority: TicketPriority) =>
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
      .is('assigned_to', null)
      .eq('priority', priority)

  const [
    totalQueueCountResult,
    criticalCountResult,
    urgentCountResult,
    highCountResult,
    mediumCountResult,
    lowCountResult,
    oldestTicketResult,
  ] = await Promise.all([
    baseQueueQuery(),
    priorityCountQuery('critical'),
    priorityCountQuery('urgent'),
    priorityCountQuery('high'),
    priorityCountQuery('medium'),
    priorityCountQuery('low'),
    supabase
      .from('tickets')
      .select('created_at')
      .in('status', ['open', 'in_progress'])
      .is('assigned_to', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const totalQueueCount = totalQueueCountResult.count || 0
  const criticalPriorityCount = criticalCountResult.count || 0
  const urgentPriorityCount = urgentCountResult.count || 0
  const highPriorityCount = highCountResult.count || 0
  const mediumPriorityCount = mediumCountResult.count || 0
  const lowPriorityCount = lowCountResult.count || 0

  let oldestTicketDays = 0
  const oldestCreatedAt = oldestTicketResult.data?.created_at
  if (oldestCreatedAt) {
    const now = new Date()
    const ticketDate = new Date(oldestCreatedAt)
    oldestTicketDays = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <QueuePageClient
      tickets={paged.tickets}
      stats={{
        total: totalQueueCount,
        critical: criticalPriorityCount,
        urgent: urgentPriorityCount,
        high: highPriorityCount,
        medium: mediumPriorityCount,
        low: lowPriorityCount,
        oldestDays: oldestTicketDays
      }}
      pagination={{
        currentPage: paged.currentPage,
        totalPages: paged.totalPages,
        totalCount: paged.totalCount
      }}
      currentPriority={params.priority}
    />
  )
}


