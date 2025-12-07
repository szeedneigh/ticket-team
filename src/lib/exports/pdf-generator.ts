/**
 * PDF Export Generator
 *
 * Generates PDF files from analytics reports with professional formatting.
 * Uses jsPDF and jspdf-autotable for table generation.
 *
 * @module lib/exports/pdf-generator
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AnalyticsReport, AnalyticsFilters } from '@/lib/types/analytics'
import { format } from 'date-fns'

/**
 * Generate a PDF export from analytics report data
 *
 * @param report - The analytics report data
 * @param filters - Filters used to generate the report
 * @returns PDF buffer ready for download
 */
export function generatePDFReport(
  report: AnalyticsReport,
  filters?: AnalyticsFilters
): Buffer {
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ========================================
  // HEADER
  // ========================================
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Ticket Team Analytics Report', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Add filter information
  if (filters) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)

    if (filters.dateRange) {
      doc.text(
        `Date Range: ${format(filters.dateRange.start, 'PP')} - ${format(filters.dateRange.end, 'PP')}`,
        pageWidth / 2,
        yPos,
        { align: 'center' }
      )
      yPos += 5
    }

    const filterTexts = []
    if (filters.category) filterTexts.push(`Category: ${filters.category}`)
    if (filters.priority) filterTexts.push(`Priority: ${filters.priority}`)
    if (filters.status) filterTexts.push(`Status: ${filters.status}`)

    if (filterTexts.length > 0) {
      doc.text(filterTexts.join(' | '), pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
    }

    doc.setTextColor(0, 0, 0)
  }

  yPos += 5

  // ========================================
  // SUMMARY SECTION
  // ========================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, yPos)
  yPos += 8

  const summaryData = [
    ['Total Tickets', (report.summary.totalTickets || 0).toString()],
    ['Open Tickets', (report.summary.openTickets || 0).toString()],
    ['Resolved Tickets', (report.summary.resolvedTickets || 0).toString()],
    ['Closed Tickets', (report.summary.closedTickets || 0).toString()],
    ['Overdue Tickets', (report.summary.overdueTickets || 0).toString()],
    ['Avg Resolution Time', report.summary.avgResolutionTime || 'N/A'],
    ['Avg Response Time', report.summary.avgResponseTime || 'N/A'],
    ['Satisfaction Score', `${report.summary.satisfactionScore?.toFixed(1) || 'N/A'}/5`],
    ['Resolution Rate', `${report.summary.resolutionRate?.toFixed(1) || 'N/A'}%`],
    ['SLA Compliance', `${report.summary.slaCompliance?.toFixed(1) || 'N/A'}%`],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 'auto' },
    },
  })

  type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } }
  const docWithTable = doc as AutoTableDoc
  yPos = (docWithTable.lastAutoTable?.finalY ?? yPos) + 10

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage()
    yPos = 20
  }

  // ========================================
  // CATEGORY DISTRIBUTION
  // ========================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Tickets by Category', 14, yPos)
  yPos += 8

  if (report.categoryDistribution && report.categoryDistribution.length > 0) {
    const categoryData = report.categoryDistribution.map((cat) => [
      cat.category,
      cat.count.toString(),
      `${cat.percentage.toFixed(1)}%`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Count', 'Percentage']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    })

    const docWithTableCategory = doc as AutoTableDoc
    yPos = (docWithTableCategory.lastAutoTable?.finalY ?? yPos) + 10
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('No data available', 14, yPos)
    yPos += 10
  }

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage()
    yPos = 20
  }

  // ========================================
  // PRIORITY DISTRIBUTION
  // ========================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Tickets by Priority', 14, yPos)
  yPos += 8

  if (report.priorityDistribution && report.priorityDistribution.length > 0) {
    const priorityData = report.priorityDistribution.map((pri) => [
      pri.priority,
      pri.count.toString(),
      `${pri.percentage.toFixed(1)}%`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Priority', 'Count', 'Percentage']],
      body: priorityData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    })

    const docWithTablePriority = doc as AutoTableDoc
    yPos = (docWithTablePriority.lastAutoTable?.finalY ?? yPos) + 10
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('No data available', 14, yPos)
    yPos += 10
  }

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage()
    yPos = 20
  }

  // ========================================
  // STATUS DISTRIBUTION
  // ========================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Tickets by Status', 14, yPos)
  yPos += 8

  if (report.statusDistribution && report.statusDistribution.length > 0) {
    const statusData = report.statusDistribution.map((stat) => [
      stat.status,
      stat.count.toString(),
      `${stat.percentage.toFixed(1)}%`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('No data available', 14, yPos)
  }

  // ========================================
  // FOOTER ON ALL PAGES
  // ========================================
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} | Ticket Team © ${new Date().getFullYear()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Return PDF as buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}
