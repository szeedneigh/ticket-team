/**
 * Analytics Export Utilities
 *
 * Functions to export analytics data in various formats (CSV, PDF, JSON).
 *
 * @module lib/analytics/export
 */

import type {
  ExportFormat,
  AnalyticsSummary,
  StaffPerformance,
  PriorityDistribution,
  StatusDistribution,
  CategoryDistribution as _CategoryDistribution,
  SatisfactionBreakdown,
  AIAnalyticsData,
  TrendData,
  PeakHoursData,
} from '@/lib/types/analytics'

/**
 * Convert data to CSV format
 */
function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return ''

  const keys = headers || Object.keys(data[0])
  const headerRow = keys.join(',')

  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      })
      .join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for filename
 */
function getDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Export ticket analytics data
 */
export function exportTicketAnalytics(
  format: ExportFormat,
  data: {
    summary: AnalyticsSummary
    priorityDist: PriorityDistribution[]
    statusDist: StatusDistribution[]
    peakHours: PeakHoursData
    trends?: TrendData
  }
) {
  const dateStr = getDateString()
  const filename = `ticket-analytics-${dateStr}`

  if (format === 'json') {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, `${filename}.json`, 'application/json')
    return
  }

  if (format === 'csv') {
    // Create comprehensive CSV with multiple sections
    const sections: string[] = []

    // Summary section
    sections.push('=== TICKET ANALYTICS SUMMARY ===')
    sections.push(
      arrayToCSV([
        {
          Metric: 'Total Tickets',
          Value: data.summary.totalTickets,
        },
        {
          Metric: 'Open Tickets',
          Value: data.summary.openTickets,
        },
        {
          Metric: 'Resolved Tickets',
          Value: data.summary.resolvedTickets,
        },
        {
          Metric: 'Resolution Rate',
          Value: `${data.summary.resolutionRate}%`,
        },
        {
          Metric: 'Avg Resolution Time',
          Value: data.summary.avgResolutionTime,
        },
        {
          Metric: 'Avg Response Time',
          Value: data.summary.avgResponseTime,
        },
        {
          Metric: 'SLA Compliance',
          Value: `${data.summary.slaCompliance}%`,
        },
        {
          Metric: 'Overdue Tickets',
          Value: data.summary.overdueTickets,
        },
      ])
    )

    // Priority distribution
    sections.push('\n=== PRIORITY DISTRIBUTION ===')
    sections.push(
      arrayToCSV(
        data.priorityDist.map((p) => ({
          Priority: p.priority,
          Count: p.count,
          Percentage: `${p.percentage}%`,
          'Avg Resolution Time': p.avgResolutionTime,
        }))
      )
    )

    // Status distribution
    sections.push('\n=== STATUS DISTRIBUTION ===')
    sections.push(
      arrayToCSV(
        data.statusDist.map((s) => ({
          Status: s.status,
          Count: s.count,
          Percentage: `${s.percentage}%`,
        }))
      )
    )

    // Peak hours
    sections.push('\n=== PEAK HOURS ===')
    sections.push(
      arrayToCSV(
        data.peakHours.hourly.map((h) => ({
          Hour: h.label,
          'Ticket Count': h.count,
        }))
      )
    )

    // Peak days
    sections.push('\n=== PEAK DAYS ===')
    sections.push(
      arrayToCSV(
        data.peakHours.daily.map((d) => ({
          Day: d.label,
          'Ticket Count': d.count,
        }))
      )
    )

    // Trends (if available)
    if (data.trends && data.trends.ticketVolume.length > 0) {
      sections.push('\n=== TICKET VOLUME TREND ===')
      sections.push(
        arrayToCSV(
          data.trends.ticketVolume.map((t) => ({
            Date: t.date,
            'Ticket Count': t.value,
          }))
        )
      )
    }

    downloadFile(sections.join('\n'), `${filename}.csv`, 'text/csv')
    return
  }

  if (format === 'pdf') {
    // Generate HTML for PDF
    const html = generateTicketAnalyticsPDF(data)
    printToPDF(html)
  }
}

/**
 * Export staff performance data
 */
export function exportStaffPerformance(
  format: ExportFormat,
  data: {
    staff: StaffPerformance[]
    period: { start: string; end: string }
  }
) {
  const dateStr = getDateString()
  const filename = `staff-performance-${dateStr}`

  if (format === 'json') {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, `${filename}.json`, 'application/json')
    return
  }

  if (format === 'csv') {
    const csvContent = arrayToCSV(
      data.staff.map((s) => ({
        Name: s.userName,
        Email: s.email,
        'Tickets Assigned': s.ticketsAssigned,
        'Tickets Resolved': s.ticketsResolved,
        'Active Tickets': s.activeTickets,
        'Overdue Tickets': s.overdueTickets,
        'Avg Resolution Time': s.avgResolutionTime,
        'Avg Response Time': s.avgResponseTime,
        'Satisfaction Score': s.satisfactionScore,
      }))
    )

    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
    return
  }

  if (format === 'pdf') {
    const html = generateStaffPerformancePDF(data)
    printToPDF(html)
  }
}

/**
 * Export satisfaction analytics data
 */
export function exportSatisfactionAnalytics(
  format: ExportFormat,
  data: {
    breakdown: SatisfactionBreakdown
    period: { start: string; end: string }
  }
) {
  const dateStr = getDateString()
  const filename = `satisfaction-analytics-${dateStr}`

  if (format === 'json') {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, `${filename}.json`, 'application/json')
    return
  }

  if (format === 'csv') {
    const sections: string[] = []

    // Summary
    sections.push('=== SATISFACTION SUMMARY ===')
    sections.push(
      arrayToCSV([
        { Metric: 'Overall Score', Value: data.breakdown.overallScore },
        { Metric: 'Total Responses', Value: data.breakdown.totalResponses },
      ])
    )

    // Rating distribution
    sections.push('\n=== RATING DISTRIBUTION ===')
    sections.push(
      arrayToCSV(
        data.breakdown.distribution.map((d) => ({
          Rating: `${d.rating} Star${d.rating !== 1 ? 's' : ''}`,
          Count: d.count,
          Percentage: `${d.percentage}%`,
        }))
      )
    )

    // By category
    if (data.breakdown.byCategory.length > 0) {
      sections.push('\n=== BY CATEGORY ===')
      sections.push(
        arrayToCSV(
          data.breakdown.byCategory.map((c) => ({
            Category: c.category,
            'Avg Score': c.score,
            Responses: c.responses,
          }))
        )
      )
    }

    downloadFile(sections.join('\n'), `${filename}.csv`, 'text/csv')
    return
  }

  if (format === 'pdf') {
    const html = generateSatisfactionPDF(data)
    printToPDF(html)
  }
}

/**
 * Export AI analytics data
 */
export function exportAIAnalytics(
  format: ExportFormat,
  data: AIAnalyticsData
) {
  const dateStr = getDateString()
  const filename = `ai-analytics-${dateStr}`

  if (format === 'json') {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, `${filename}.json`, 'application/json')
    return
  }

  if (format === 'csv') {
    const sections: string[] = []

    // Summary
    sections.push('=== AI ANALYTICS SUMMARY ===')
    sections.push(
      arrayToCSV([
        { Metric: 'Total Conversations', Value: data.summary.totalConversations },
        { Metric: 'Total Queries', Value: data.summary.totalQueries },
        { Metric: 'Unique Users', Value: data.summary.uniqueUsers },
        { Metric: 'Escalation Rate', Value: `${data.summary.escalationRate}%` },
        { Metric: 'Avg Response Time', Value: data.summary.avgResponseTime },
        { Metric: 'Helpfulness Rate', Value: `${data.summary.helpfulnessRate}%` },
      ])
    )

    // Volume trend
    if (data.volumeTrend.length > 0) {
      sections.push('\n=== VOLUME TREND ===')
      sections.push(
        arrayToCSV(
          data.volumeTrend.map((v) => ({
            Date: v.date,
            Conversations: v.conversations,
            Queries: v.queries,
            Escalations: v.escalations,
          }))
        )
      )
    }

    // Common queries
    if (data.commonQueries.length > 0) {
      sections.push('\n=== COMMON QUERIES ===')
      sections.push(
        arrayToCSV(
          data.commonQueries.map((q) => ({
            Query: q.query,
            Count: q.count,
            'Avg Response Time (ms)': q.avgResponseTime,
            'Helpfulness Rate': `${q.helpfulnessRate}%`,
          }))
        )
      )
    }

    downloadFile(sections.join('\n'), `${filename}.csv`, 'text/csv')
    return
  }

  if (format === 'pdf') {
    const html = generateAIAnalyticsPDF(data)
    printToPDF(html)
  }
}

/**
 * Generate HTML for PDF export - Ticket Analytics
 */
function generateTicketAnalyticsPDF(data: {
  summary: AnalyticsSummary
  priorityDist: PriorityDistribution[]
  statusDist: StatusDistribution[]
  peakHours: PeakHoursData
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .summary-item { padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .summary-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .period { color: #666; font-size: 14px; margin-bottom: 20px; }
        @media print { body { print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <h1>Ticket Analytics Report</h1>
      <p class="period">Period: ${data.summary.period.start} to ${data.summary.period.end}</p>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">Total Tickets</div>
          <div class="value">${data.summary.totalTickets}</div>
        </div>
        <div class="summary-item">
          <div class="label">Resolution Rate</div>
          <div class="value">${data.summary.resolutionRate}%</div>
        </div>
        <div class="summary-item">
          <div class="label">Avg Resolution Time</div>
          <div class="value">${data.summary.avgResolutionTime}</div>
        </div>
        <div class="summary-item">
          <div class="label">SLA Compliance</div>
          <div class="value">${data.summary.slaCompliance}%</div>
        </div>
      </div>

      <h2>Priority Distribution</h2>
      <table>
        <thead>
          <tr><th>Priority</th><th>Count</th><th>Percentage</th><th>Avg Resolution</th></tr>
        </thead>
        <tbody>
          ${data.priorityDist.map(p => `
            <tr>
              <td style="text-transform: capitalize">${p.priority}</td>
              <td>${p.count}</td>
              <td>${p.percentage}%</td>
              <td>${p.avgResolutionTime}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Status Distribution</h2>
      <table>
        <thead>
          <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
        </thead>
        <tbody>
          ${data.statusDist.map(s => `
            <tr>
              <td style="text-transform: capitalize">${s.status.replace('_', ' ')}</td>
              <td>${s.count}</td>
              <td>${s.percentage}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="margin-top: 40px; font-size: 12px; color: #999;">
        Generated on ${new Date().toLocaleString()} | Ticket Team Analytics
      </p>
    </body>
    </html>
  `
}

/**
 * Generate HTML for PDF export - Staff Performance
 */
function generateStaffPerformancePDF(data: {
  staff: StaffPerformance[]
  period: { start: string; end: string }
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Staff Performance Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .period { color: #666; font-size: 14px; margin-bottom: 20px; }
        @media print { body { print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <h1>Staff Performance Report</h1>
      <p class="period">Period: ${data.period.start} to ${data.period.end}</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Assigned</th>
            <th>Resolved</th>
            <th>Active</th>
            <th>Overdue</th>
            <th>Avg Resolution</th>
            <th>Satisfaction</th>
          </tr>
        </thead>
        <tbody>
          ${data.staff.map(s => `
            <tr>
              <td>${s.userName}</td>
              <td>${s.ticketsAssigned}</td>
              <td>${s.ticketsResolved}</td>
              <td>${s.activeTickets}</td>
              <td>${s.overdueTickets}</td>
              <td>${s.avgResolutionTime}</td>
              <td>${s.satisfactionScore > 0 ? s.satisfactionScore.toFixed(1) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="margin-top: 40px; font-size: 12px; color: #999;">
        Generated on ${new Date().toLocaleString()} | Ticket Team Analytics
      </p>
    </body>
    </html>
  `
}

/**
 * Generate HTML for PDF export - Satisfaction
 */
function generateSatisfactionPDF(data: {
  breakdown: SatisfactionBreakdown
  period: { start: string; end: string }
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Satisfaction Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .summary-item { padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .summary-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .period { color: #666; font-size: 14px; margin-bottom: 20px; }
        @media print { body { print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <h1>Satisfaction Analytics Report</h1>
      <p class="period">Period: ${data.period.start} to ${data.period.end}</p>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">Overall Score</div>
          <div class="value">${data.breakdown.overallScore}/5</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Responses</div>
          <div class="value">${data.breakdown.totalResponses}</div>
        </div>
      </div>

      <h2>Rating Distribution</h2>
      <table>
        <thead>
          <tr><th>Rating</th><th>Count</th><th>Percentage</th></tr>
        </thead>
        <tbody>
          ${data.breakdown.distribution.map(d => `
            <tr>
              <td>${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</td>
              <td>${d.count}</td>
              <td>${d.percentage}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${data.breakdown.byCategory.length > 0 ? `
        <h2>By Category</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Score</th><th>Responses</th></tr>
          </thead>
          <tbody>
            ${data.breakdown.byCategory.map(c => `
              <tr>
                <td>${c.category}</td>
                <td>${c.score}</td>
                <td>${c.responses}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <p style="margin-top: 40px; font-size: 12px; color: #999;">
        Generated on ${new Date().toLocaleString()} | Ticket Team Analytics
      </p>
    </body>
    </html>
  `
}

/**
 * Generate HTML for PDF export - AI Analytics
 */
function generateAIAnalyticsPDF(data: AIAnalyticsData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .summary-item { padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .summary-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .period { color: #666; font-size: 14px; margin-bottom: 20px; }
        @media print { body { print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <h1>AI Chat Analytics Report</h1>
      <p class="period">Period: ${data.summary.period.start} to ${data.summary.period.end}</p>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">Total Conversations</div>
          <div class="value">${data.summary.totalConversations}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Queries</div>
          <div class="value">${data.summary.totalQueries}</div>
        </div>
        <div class="summary-item">
          <div class="label">Unique Users</div>
          <div class="value">${data.summary.uniqueUsers}</div>
        </div>
        <div class="summary-item">
          <div class="label">Escalation Rate</div>
          <div class="value">${data.summary.escalationRate}%</div>
        </div>
        <div class="summary-item">
          <div class="label">Avg Response Time</div>
          <div class="value">${data.summary.avgResponseTime}</div>
        </div>
        <div class="summary-item">
          <div class="label">Helpfulness Rate</div>
          <div class="value">${data.summary.helpfulnessRate}%</div>
        </div>
      </div>

      ${data.commonQueries.length > 0 ? `
        <h2>Common Queries</h2>
        <table>
          <thead>
            <tr><th>Query</th><th>Count</th><th>Helpfulness</th></tr>
          </thead>
          <tbody>
            ${data.commonQueries.slice(0, 10).map(q => `
              <tr>
                <td>${q.query}</td>
                <td>${q.count}</td>
                <td>${q.helpfulnessRate}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <p style="margin-top: 40px; font-size: 12px; color: #999;">
        Generated on ${new Date().toLocaleString()} | Ticket Team Analytics
      </p>
    </body>
    </html>
  `
}

/**
 * Print HTML to PDF using browser print dialog
 */
function printToPDF(html: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.')
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
  }
}
