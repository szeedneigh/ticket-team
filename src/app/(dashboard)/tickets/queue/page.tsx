import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TicketFilters as TTicketFilters, TimePeriod } from '@/lib/types/tickets'
import type { TicketPriority } from '@/lib/types/database'
import { isStaffOrAbove } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants'
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

  // Parallelize: Get authenticated user info AND fetch tickets simultaneously
  const [authResult, userResult, ticketsResult] = await Promise.all([
    supabase.auth.getUser(),
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return null
      return supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', authUser.id)
        .single()
    })(),
    supabase
      .from('tickets')
      .select(`
        *,
        user:users!tickets_user_id_fkey(id, full_name, email, avatar_url),
        assigned_user:users!tickets_assigned_to_fkey(id, full_name, email, avatar_url)
      `)
      .in('status', ['open', 'in_progress'])
      .is('assigned_to', null)
      .order('created_at', { ascending: false })
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

  const { data: allTickets, error: ticketsError } = ticketsResult

  if (ticketsError) {
    console.error('Error fetching queue tickets:', ticketsError)
  }

  const queueTickets = allTickets || []

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
    <QueuePageClient
      tickets={paginatedTickets}
      stats={{
        total: queueTickets.length,
        high: highPriorityCount,
        medium: mediumPriorityCount,
        oldestDays: oldestTicketDays
      }}
      pagination={{
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount
      }}
      currentPriority={params.priority}
    />
  )
}


