/**
 * Analytics Trends API Route
 *
 * GET /api/v1/analytics/trends - Get time series trend data
 *
 * Query Parameters:
 * - startDate: ISO date string for range start (optional, defaults to 30 days ago)
 * - endDate: ISO date string for range end (optional, defaults to now)
 * - granularity: Time granularity (hourly, daily, weekly, monthly) (optional, defaults to daily)
 *
 * Authorization: Admin or Super Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTicketTrends } from '@/lib/analytics/queries'
import { ERROR_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { DateRange, TimeGranularity } from '@/lib/types/analytics'

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
    const granularityParam = searchParams.get('granularity')

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

    // Validate granularity
    const validGranularities: TimeGranularity[] = ['hourly', 'daily', 'weekly', 'monthly']
    let granularity: TimeGranularity = 'daily'

    if (granularityParam) {
      if (!validGranularities.includes(granularityParam as TimeGranularity)) {
        return NextResponse.json(
          {
            error: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}`,
          },
          { status: 400 }
        )
      }
      granularity = granularityParam as TimeGranularity
    }

    // Fetch trend data
    const trends = await getTicketTrends(user.id, dateRange, granularity)

    return NextResponse.json({
      success: true,
      data: trends,
    })
  } catch (error) {
    logger.error('Error fetching analytics trends', {
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
