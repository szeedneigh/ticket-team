/**
 * Analytics Summary API Route
 *
 * GET /api/v1/analytics/summary - Get KPI summary data
 *
 * Query Parameters:
 * - startDate: ISO date string for range start (optional, defaults to 30 days ago)
 * - endDate: ISO date string for range end (optional, defaults to now)
 *
 * Authorization: Admin or Super Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsSummary } from '@/lib/analytics/queries'
import { ERROR_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { DateRange } from '@/lib/types/analytics'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 })
    }

    // Verify user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      logger.error('Error fetching user role', { error: userError?.message, userId: user.id })
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 403 })
    }

    // Check if user is admin or super_admin
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateRange: DateRange | undefined

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      }

      // Validate dates
      if (isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO date strings.' },
          { status: 400 }
        )
      }

      if (dateRange.start > dateRange.end) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }
    }

    // Fetch analytics summary
    const summary = await getAnalyticsSummary(user.id, dateRange)

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error) {
    logger.error('Error fetching analytics summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      },
      { status: 500 }
    )
  }
}
