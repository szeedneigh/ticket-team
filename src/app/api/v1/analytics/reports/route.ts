/**
 * Analytics Reports API Route
 *
 * GET /api/v1/analytics/reports - Get detailed analytics reports
 *
 * Query Parameters:
 * - startDate: ISO date string for range start (optional, defaults to 30 days ago)
 * - endDate: ISO date string for range end (optional, defaults to now)
 * - category: Filter by specific category (optional)
 * - priority: Filter by priority (low, medium, high) (optional)
 * - status: Filter by status (open, in_progress, resolved, closed) (optional)
 * - format: Export format (json, csv, pdf) (optional, defaults to json)
 *
 * Authorization: Admin or Super Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsReport } from '@/lib/analytics/queries'
import { ERROR_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { AnalyticsFilters, ExportFormat } from '@/lib/types/analytics'
import { format as formatDate } from 'date-fns'

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
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const format = searchParams.get('format') || 'json'

    // Build filters
    const filters: AnalyticsFilters = {}

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO date strings.' },
          { status: 400 }
        )
      }

      if (start > end) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }

      filters.dateRange = { start, end }
    }

    if (category) {
      filters.category = category
    }

    if (priority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority. Must be: low, medium, or high' },
          { status: 400 }
        )
      }
      filters.priority = priority as 'low' | 'medium' | 'high'
    }

    if (status) {
      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: open, in_progress, resolved, or closed' },
          { status: 400 }
        )
      }
      filters.status = status as 'open' | 'in_progress' | 'resolved' | 'closed'
    }

    // Validate export format
    const validFormats: ExportFormat[] = ['json', 'csv', 'pdf']
    if (!validFormats.includes(format as ExportFormat)) {
      return NextResponse.json(
        {
          error: `Invalid format. Must be one of: ${validFormats.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Fetch complete analytics report
    const report = await getAnalyticsReport(user.id, filters)

    // Handle different export formats
    switch (format) {
      case 'json':
        return NextResponse.json({
          success: true,
          data: report,
        })

      case 'csv': {
        // Dynamically import CSV generator only when needed
        const { generateCSVReport } = await import('@/lib/exports/csv-generator')
        const csvContent = generateCSVReport(report, filters)
        const filename = `analytics-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      }

      case 'pdf': {
        // Dynamically import PDF generator only when needed
        const { generatePDFReport } = await import('@/lib/exports/pdf-generator')
        const pdfBuffer = generatePDFReport(report, filters)
        const filename = `analytics-report-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`
        // Convert Buffer to Uint8Array for NextResponse compatibility
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      }

      default:
        return NextResponse.json({
          success: true,
          data: report,
        })
    }
  } catch (error) {
    logger.error('Error generating analytics report', {
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
