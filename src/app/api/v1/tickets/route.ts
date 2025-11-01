/**
 * Tickets API Route
 *
 * GET /api/v1/tickets - Fetch tickets with filters and pagination
 *
 * Query Parameters:
 * - status: Filter by ticket status (open, in_progress, etc.)
 * - priority: Filter by priority (low, medium, high)
 * - search: Search in title/description
 * - userId: Filter by ticket submitter
 * - assignedTo: Filter by assigned staff member
 * - category: Filter by category
 * - cursor: Pagination cursor (created_at timestamp)
 * - limit: Page size (default: 20, max: 50)
 * - order: Sort order (asc/desc, default: desc)
 * - orderBy: Sort field (created_at, updated_at, priority)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTickets } from '@/lib/tickets/queries'
import type { TicketFilters, TicketQueryOptions } from '@/lib/tickets/queries'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'
import { PAGINATION } from '@/lib/constants/pagination'
import { ERROR_MESSAGES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams

    // Build filters
    const filters: TicketFilters = {}

    const status = searchParams.get('status')
    if (status) {
      filters.status = status as TicketStatus
    }

    const priority = searchParams.get('priority')
    if (priority) {
      filters.priority = priority as TicketPriority
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    const userId = searchParams.get('userId')
    if (userId) {
      filters.user_id = userId
    }

    const assignedTo = searchParams.get('assignedTo')
    if (assignedTo) {
      filters.assigned_to = assignedTo
    }

    const category = searchParams.get('category')
    if (category) {
      filters.category = category
    }

    const createdAfter = searchParams.get('createdAfter')
    if (createdAfter) {
      filters.created_after = createdAfter
    }

    const createdBefore = searchParams.get('createdBefore')
    if (createdBefore) {
      filters.created_before = createdBefore
    }

    // Build query options
    const options: TicketQueryOptions = {}

    const cursor = searchParams.get('cursor')
    if (cursor) {
      options.cursor = cursor
    }

    const limit = searchParams.get('limit')
    if (limit) {
      const parsedLimit = parseInt(limit, 10)
      if (!isNaN(parsedLimit)) {
        options.limit = Math.min(parsedLimit, PAGINATION.MAX_PAGE_SIZE)
      }
    }

    const order = searchParams.get('order')
    if (order === 'asc' || order === 'desc') {
      options.order = order
    }

    const orderBy = searchParams.get('orderBy')
    if (orderBy === 'created_at' || orderBy === 'updated_at' || orderBy === 'priority') {
      options.orderBy = orderBy
    }

    // Fetch tickets with RLS enforced
    const result = await getTickets(supabase, filters, options)

    // Return paginated response
    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasMore: result.hasMore,
        count: result.items.length,
      },
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.GENERIC,
      },
      { status: 500 }
    )
  }
}
