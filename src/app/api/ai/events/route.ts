/**
 * AI Events API Route
 * 
 * Receives batched AI events from client and inserts them into the database.
 * Handles authentication and basic validation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BatchAiEventsPayload, ClientAiEvent } from '@/lib/types/ai-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/events
 * 
 * Receives batched AI events from the client
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = userData?.role

    // 3. Parse request body
    const body = await request.json() as BatchAiEventsPayload

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid payload: events array required' },
        { status: 400 }
      )
    }

    // 4. Validate and transform events
    const eventsToInsert = body.events
      .filter((event: ClientAiEvent) => {
        // Basic validation
        return (
          event.eventType &&
          event.surface &&
          event.content &&
          event.content.length > 0
        )
      })
      .map((event: ClientAiEvent) => ({
        event_type: event.eventType,
        surface: event.surface,
        content: event.content,
        sensitivity: event.sensitivity || 'internal',
        user_id: user.id,
        user_role: userRole,
        session_id: event.sessionId,
        metadata: event.metadata || {},
        ticket_id: event.ticketId,
        comment_id: event.commentId,
        article_id: event.articleId,
      }))

    if (eventsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No valid events to insert' },
        { status: 400 }
      )
    }

    // 5. Insert events in bulk
    const { data, error } = await supabase
      .from('ai_events')
      .insert(eventsToInsert)
      .select('id')

    if (error) {
      console.error('[POST /api/ai/events] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to insert events' },
        { status: 500 }
      )
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
    })
  } catch (error) {
    console.error('[POST /api/ai/events] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/events
 * 
 * Get unprocessed events count (for debugging/monitoring)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get counts
    const { count: unprocessedCount, error: unprocessedError } = await supabase
      .from('ai_events')
      .select('*', { count: 'exact', head: true })
      .is('processed_at', null)

    const { count: totalCount, error: totalError } = await supabase
      .from('ai_events')
      .select('*', { count: 'exact', head: true })

    if (unprocessedError || totalError) {
      console.error('[GET /api/ai/events] Database error:', unprocessedError || totalError)
      return NextResponse.json(
        { error: 'Failed to fetch counts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      unprocessed: unprocessedCount || 0,
      total: totalCount || 0,
      processed: (totalCount || 0) - (unprocessedCount || 0),
    })
  } catch (error) {
    console.error('[GET /api/ai/events] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






