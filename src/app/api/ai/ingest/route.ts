/**
 * AI Ingestion API Route
 * 
 * Triggers the embedding ingestion and enrichment pipeline.
 * Processes unprocessed AI events and generates embeddings.
 * 
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  processUnprocessedEvents,
  processAllPendingEvents,
  getIngestionStats,
} from '@/lib/ai/ingestion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max execution time

/**
 * GET /api/ai/ingest
 * 
 * Get ingestion pipeline stats
 */
export async function GET() {
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

    // 2. Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // 3. Get stats
    const stats = await getIngestionStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[GET /api/ai/ingest] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/ingest
 * 
 * Trigger ingestion pipeline
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

    // 2. Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json().catch(() => ({}))
    const batchSize = body.batchSize || 50
    const processAll = body.processAll === true

    // 4. Process events
    const startTime = Date.now()

    let result
    if (processAll) {
      result = await processAllPendingEvents()
    } else {
      const batchResult = await processUnprocessedEvents(batchSize)
      result = {
        totalProcessed: batchResult.processed,
        totalFailed: batchResult.failed,
        totalBatches: batchResult.total > 0 ? 1 : 0,
      }
    }

    const duration = Date.now() - startTime

    // 5. Return results
    return NextResponse.json({
      success: true,
      processed: result.totalProcessed,
      failed: result.totalFailed,
      batches: result.totalBatches,
      durationMs: duration,
    })
  } catch (error) {
    console.error('[POST /api/ai/ingest] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

