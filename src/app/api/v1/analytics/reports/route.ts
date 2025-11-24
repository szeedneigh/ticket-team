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
import type { AnalyticsFilters, ExportFormat, AnalyticsReport } from '@/lib/types/analytics'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format as formatDate } from 'date-fns'

// ============================================================================
// CSV Export Helper
// ============================================================================

function generateCSVReport(report: AnalyticsReport, filters?: AnalyticsFilters): string {
  const sections: string[] = []

  // Header
  sections.push('Analytics Report')
  if (filters?.dateRange) {
    sections.push(`Period: ${formatDate(filters.dateRange.start, 'MMM dd, yyyy')} - ${formatDate(filters.dateRange.end, 'MMM dd, yyyy')}`)
  }
  sections.push(`Generated: ${formatDate(new Date(), 'MMM dd, yyyy HH:mm')}`)
  sections.push('')

  // Summary
  sections.push('SUMMARY')
  sections.push(Papa.unparse([
    ['Metric', 'Value'],
    ['Total Tickets', report.summary.totalTickets],
    ['Open Tickets', report.summary.openTickets],
    ['Resolved', report.summary.resolvedTickets],
    ['Closed', report.summary.closedTickets],
    ['Overdue', report.summary.overdueTickets],
    ['Avg Resolution Time', report.summary.avgResolutionTime],
    ['Avg Response Time', report.summary.avgResponseTime],
    ['Satisfaction Score', report.summary.satisfactionScore.toFixed(2)],
  ]))
  sections.push('')

  // Category Distribution
  sections.push('CATEGORY DISTRIBUTION')
  sections.push(Papa.unparse([
    ['Category', 'Count', 'Percentage'],
    ...report.categoryDistribution.map(c => [c.category, c.count, `${c.percentage.toFixed(1)}%`])
  ]))
  sections.push('')

  // Priority Distribution
  sections.push('PRIORITY DISTRIBUTION')
  sections.push(Papa.unparse([
    ['Priority', 'Count', 'Percentage'],
    ...report.priorityDistribution.map(p => [p.priority, p.count, `${p.percentage.toFixed(1)}%`])
  ]))
  sections.push('')

  // Status Distribution
  sections.push('STATUS DISTRIBUTION')
  sections.push(Papa.unparse([
    ['Status', 'Count', 'Percentage'],
    ...report.statusDistribution.map(s => [s.status, s.count, `${s.percentage.toFixed(1)}%`])
  ]))
  sections.push('')

  // Staff Performance
  sections.push('STAFF PERFORMANCE')
  sections.push(Papa.unparse([
    ['Staff', 'Assigned', 'Resolved', 'Avg Resolution', 'Satisfaction'],
    ...report.staffPerformance.map(s => [
      s.userName,
      s.ticketsAssigned,
      s.ticketsResolved,
      s.avgResolutionTime,
      s.satisfactionScore ? s.satisfactionScore.toFixed(1) : 'N/A'
    ])
  ]))
  sections.push('')

  // Satisfaction
  sections.push('SATISFACTION BREAKDOWN')
  sections.push(Papa.unparse([
    ['Overall Score', report.satisfactionBreakdown.overallScore.toFixed(2)],
    ['Total Responses', report.satisfactionBreakdown.totalResponses],
    [''],
    ['Rating', 'Count', 'Percentage'],
    ...report.satisfactionBreakdown.distribution.map(d => [`${d.rating} stars`, d.count, `${d.percentage.toFixed(1)}%`])
  ]))
  sections.push('')

  // SLA Compliance
  sections.push('SLA COMPLIANCE')
  sections.push(Papa.unparse([
    ['Metric', 'Value'],
    ['Overall Compliance', `${report.slaCompliance.overall.toFixed(1)}%`],
    ['Within SLA', report.slaCompliance.withinSLA],
    ['Breached SLA', report.slaCompliance.breachedSLA],
    ['Avg Breach Time', report.slaCompliance.averageBreachTime],
  ]))

  return sections.join('\n')
}

// ============================================================================
// PDF Export Helper
// ============================================================================

function generatePDFReport(report: AnalyticsReport, filters?: AnalyticsFilters): ArrayBuffer {
  const doc = new jsPDF()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Analytics Report', 105, yPos, { align: 'center' })
  yPos += 10

  // Date range
  if (filters?.dateRange) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Period: ${formatDate(filters.dateRange.start, 'MMM dd, yyyy')} - ${formatDate(filters.dateRange.end, 'MMM dd, yyyy')}`, 105, yPos, { align: 'center' })
    yPos += 15
  }

  // Summary
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, yPos)
  yPos += 5

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Tickets', report.summary.totalTickets.toString()],
      ['Open', report.summary.openTickets.toString()],
      ['Resolved', report.summary.resolvedTickets.toString()],
      ['Avg Resolution', report.summary.avgResolutionTime],
      ['Satisfaction', report.summary.satisfactionScore.toFixed(2)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Category Distribution
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Categories', 14, yPos)
  yPos += 5

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Count', 'Percentage']],
    body: report.categoryDistribution.map(c => [c.category, c.count.toString(), `${c.percentage.toFixed(1)}%`]),
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  })

  return doc.output('arraybuffer')
}

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
        const pdfBuffer = generatePDFReport(report, filters)
        const filename = `analytics-report-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`
        return new NextResponse(pdfBuffer, {
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
