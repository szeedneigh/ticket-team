import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTicketWithRelations } from '@/lib/tickets/queries'
import { ERROR_MESSAGES } from '@/lib/constants'

/**
 * GET /api/v1/tickets/[id]
 *
 * Fetch a single ticket with all relations:
 * - Ticket details with user info
 * - Comments (filtered by RLS for is_internal)
 * - Activities for timeline
 * - Attachments
 *
 * RLS policies automatically enforce access control based on user role.
 */
export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const supabase = await createClient()

    // 1. Authenticate user
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

    // 2. Fetch ticket with all relations
    const ticketId = params.id

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    const ticketData = await getTicketWithRelations(supabase, ticketId)

    if (!ticketData) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.TICKET_NOT_FOUND },
        { status: 404 }
      )
    }

    // 3. Fetch attachments separately
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachments')
      .select(`
        id,
        filename,
        storage_path,
        mime_type,
        size_bytes,
        created_at,
        uploaded_by,
        user:users!attachments_uploaded_by_fkey(id, full_name, email)
      `)
      .eq('ticket_id', ticketId)
      .is('deleted_at', null) // Only non-deleted attachments
      .order('created_at', { ascending: true })

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError)
    }

    // 4. Return combined data
    return NextResponse.json({
      ticket: ticketData.ticket,
      comments: ticketData.comments.items, // Extract items from paginated response
      activities: ticketData.activities,
      attachments: attachments || [],
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/tickets/[id]:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    )
  }
}
