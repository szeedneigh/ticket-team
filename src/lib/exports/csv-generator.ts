/**
 * CSV Export Generator
 *
 * Generates CSV files from analytics reports for easy data export and analysis.
 * Uses PapaParse for robust CSV generation with proper escaping.
 *
 * @module lib/exports/csv-generator
 */

import { unparse } from 'papaparse'
import type { AnalyticsReport, AnalyticsFilters } from '@/lib/types/analytics'
import { format } from 'date-fns'

/**
 * Generate a CSV export from analytics report data
 *
 * @param report - The analytics report data
 * @param filters - Filters used to generate the report
 * @returns CSV string ready for download
 */
export function generateCSVReport(
  report: AnalyticsReport,
  filters?: AnalyticsFilters
): string {
  // Build header with metadata
  const metadata = [
    ['Ticket Team Analytics Report'],
    ['Generated:', format(new Date(), 'PPpp')],
    [],
  ]

  // Add filter information if provided
  if (filters) {
    if (filters.dateRange) {
      metadata.push([
        'Date Range:',
        `${format(filters.dateRange.start, 'PP')} - ${format(filters.dateRange.end, 'PP')}`,
      ])
    }
    if (filters.category) {
      metadata.push(['Category:', filters.category])
    }
    if (filters.priority) {
      metadata.push(['Priority:', filters.priority])
    }
    if (filters.status) {
      metadata.push(['Status:', filters.status])
    }
    metadata.push([])
  }

  // Summary section
  const summary = [
    ['=== SUMMARY ==='],
    ['Total Tickets', report.summary.totalTickets?.toString() || '0'],
    ['Open Tickets', report.summary.openTickets?.toString() || '0'],
    ['Resolved Tickets', report.summary.resolvedTickets?.toString() || '0'],
    ['Closed Tickets', report.summary.closedTickets?.toString() || '0'],
    ['Overdue Tickets', report.summary.overdueTickets?.toString() || '0'],
    ['Avg Resolution Time', report.summary.avgResolutionTime || 'N/A'],
    ['Avg Response Time', report.summary.avgResponseTime || 'N/A'],
    ['Satisfaction Score', `${report.summary.satisfactionScore?.toFixed(1) || 'N/A'}/5`],
    ['Resolution Rate', `${report.summary.resolutionRate?.toFixed(1) || 'N/A'}%`],
    ['SLA Compliance', `${report.summary.slaCompliance?.toFixed(1) || 'N/A'}%`],
    [],
  ]

  // Category distribution
  const categorySection = [['=== TICKETS BY CATEGORY ===']]
  if (report.categoryDistribution && report.categoryDistribution.length > 0) {
    categorySection.push(['Category', 'Count', 'Percentage'])
    report.categoryDistribution.forEach((cat) => {
      categorySection.push([
        cat.category,
        cat.count.toString(),
        `${cat.percentage.toFixed(1)}%`,
      ])
    })
  } else {
    categorySection.push(['No data available'])
  }
  categorySection.push([])

  // Priority distribution
  const prioritySection = [['=== TICKETS BY PRIORITY ===']]
  if (report.priorityDistribution && report.priorityDistribution.length > 0) {
    prioritySection.push(['Priority', 'Count', 'Percentage'])
    report.priorityDistribution.forEach((pri) => {
      prioritySection.push([
        pri.priority,
        pri.count.toString(),
        `${pri.percentage.toFixed(1)}%`,
      ])
    })
  } else {
    prioritySection.push(['No data available'])
  }
  prioritySection.push([])

  // Status distribution
  const statusSection = [['=== TICKETS BY STATUS ===']]
  if (report.statusDistribution && report.statusDistribution.length > 0) {
    statusSection.push(['Status', 'Count', 'Percentage'])
    report.statusDistribution.forEach((stat) => {
      statusSection.push([
        stat.status,
        stat.count.toString(),
        `${stat.percentage.toFixed(1)}%`,
      ])
    })
  } else {
    statusSection.push(['No data available'])
  }
  statusSection.push([])

  // Combine all sections
  const allRows = [
    ...metadata,
    ...summary,
    ...categorySection,
    ...prioritySection,
    ...statusSection,
  ]

  // Generate CSV using PapaParse
  return unparse(allRows, {
    quotes: true, // Quote all fields for safety
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    header: false,
    newline: '\r\n',
  })
}

/**
 * Generate a simplified CSV for ticket list export
 *
 * @param tickets - Array of ticket data
 * @returns CSV string
 */
export interface TicketExportRow {
  id: string
  title: string
  status: string
  priority: string
  category: string
  subcategory?: string | null
  created_at: string
  updated_at?: string | null
  resolved_at?: string | null
  assigned_user?: { full_name?: string | null } | null
  user?: { full_name?: string | null } | null
}

export function generateTicketListCSV(tickets: TicketExportRow[]): string {
  if (!tickets || tickets.length === 0) {
    return 'No tickets to export'
  }

  // Define columns to export
  const data = tickets.map((ticket) => ({
    ID: ticket.id,
    Title: ticket.title,
    Status: ticket.status,
    Priority: ticket.priority,
    Category: ticket.category,
    Subcategory: ticket.subcategory || '',
    'Created At': format(new Date(ticket.created_at), 'PPpp'),
    'Updated At': ticket.updated_at ? format(new Date(ticket.updated_at), 'PPpp') : '',
    'Resolved At': ticket.resolved_at ? format(new Date(ticket.resolved_at), 'PPpp') : '',
    'Assigned To': ticket.assigned_user?.full_name || 'Unassigned',
    'Created By': ticket.user?.full_name || 'Unknown',
  }))

  return unparse(data, {
    quotes: true,
    header: true,
  })
}
