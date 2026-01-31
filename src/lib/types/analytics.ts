/**
 * Analytics Types
 *
 * Type definitions for analytics and reporting features.
 *
 * @module lib/types/analytics
 */

/**
 * Date range for analytics queries
 */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * Granularity for time series data
 */
export type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly'

/**
 * KPI Summary Statistics
 */
export interface AnalyticsSummary {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  avgResolutionTime: string // formatted (e.g., "2.5h")
  avgResolutionTimeHours: number // raw hours for calculations
  avgResponseTime: string // formatted
  avgResponseTimeHours: number // raw hours
  satisfactionScore: number // 0-5 rating
  resolutionRate: number // percentage (0-100)
  slaCompliance: number // percentage (0-100)
  overdueTickets: number
  period: {
    start: string
    end: string
  }
}

/**
 * Time series data point for trend charts
 */
export interface TrendDataPoint {
  date: string // ISO date
  value: number
  label?: string // optional formatted label
  [key: string]: string | number | undefined
}

/**
 * Trend data for various metrics
 */
export interface TrendData {
  ticketVolume: TrendDataPoint[]
  resolutionRate: TrendDataPoint[]
  avgResponseTime: TrendDataPoint[]
  satisfaction: TrendDataPoint[]
  granularity: TimeGranularity
  period: {
    start: string
    end: string
  }
}

/**
 * Category distribution data
 */
export interface CategoryDistribution {
  category: string
  count: number
  percentage: number
  avgResolutionTime: string
  avgResolutionTimeHours: number
}

/**
 * Priority distribution data
 */
export interface PriorityDistribution {
  priority: 'low' | 'medium' | 'high'
  count: number
  percentage: number
  avgResolutionTime: string
  avgResolutionTimeHours: number
}

/**
 * Status distribution data
 */
export interface StatusDistribution {
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  count: number
  percentage: number
}

/**
 * Staff performance metrics
 */
export interface StaffPerformance {
  userId: string
  userName: string
  email: string
  ticketsResolved: number
  ticketsAssigned: number
  avgResolutionTime: string
  avgResolutionTimeHours: number
  avgResponseTime: string
  avgResponseTimeHours: number
  satisfactionScore: number
  activeTickets: number
  overdueTickets: number
  feedbackCount: number
  dailyMetrics: {
    date: string
    assigned: number
    resolved: number
    avgResponseTime: number
    satisfactionScore: number
  }[]
}

/**
 * Peak hours analysis data
 */
export interface PeakHoursData {
  hourly: Array<{
    hour: number // 0-23
    count: number
    label: string // e.g., "9 AM"
  }>
  daily: Array<{
    day: number // 0-6 (Sunday-Saturday)
    count: number
    label: string // e.g., "Monday"
  }>
}

/**
 * SLA compliance data
 */
export interface SLACompliance {
  overall: number // percentage
  byPriority: {
    low: number
    medium: number
    high: number
  }
  withinSLA: number
  breachedSLA: number
  averageBreachTime: string // formatted
  averageBreachTimeHours: number
}

/**
 * Satisfaction breakdown
 */
export interface SatisfactionBreakdown {
  overallScore: number
  totalResponses: number
  distribution: {
    rating: number // 1-5
    count: number
    percentage: number
  }[]
  byCategory: {
    category: string
    score: number
    responses: number
  }[]
  recentFeedback: {
    id: string
    rating: number
    comment: string | null
    ticketId: string
    createdAt: string
  }[]
}

/**
 * Detailed analytics report
 */
export interface AnalyticsReport {
  summary: AnalyticsSummary
  categoryDistribution: CategoryDistribution[]
  priorityDistribution: PriorityDistribution[]
  statusDistribution: StatusDistribution[]
  staffPerformance: StaffPerformance[]
  satisfactionBreakdown: SatisfactionBreakdown
  slaCompliance: SLACompliance
  peakHours: PeakHoursData
}

/**
 * Analytics filters
 */
export interface AnalyticsFilters {
  dateRange?: DateRange
  category?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string
  department?: string
}

/**
 * Chart data format (generic for all chart types)
 */
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    fill?: boolean
  }[]
}

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'pdf' | 'json'

/**
 * Export request
 */
export interface ExportRequest {
  format: ExportFormat
  reportType: 'summary' | 'trends' | 'detailed'
  filters?: AnalyticsFilters
}

/**
 * AI Analytics Summary
 */
export interface AIAnalyticsSummary {
  totalConversations: number
  totalQueries: number
  escalationRate: number
  avgResponseTime: string
  avgResponseTimeMs: number
  helpfulnessRate: number
  helpfulCount: number
  notHelpfulCount: number
  uniqueUsers: number
  period: {
    start: string
    end: string
  }
}

/**
 * AI conversation volume trend data
 */
export interface AIVolumeTrend {
  date: string
  conversations: number
  queries: number
  escalations: number
}

/**
 * Common query data
 */
export interface CommonQuery {
  query: string
  count: number
  avgResponseTime: number
  helpfulnessRate: number
}

/**
 * AI Analytics data
 */
export interface AIAnalyticsData {
  summary: AIAnalyticsSummary
  volumeTrend: AIVolumeTrend[]
  commonQueries: CommonQuery[]
  helpfulnessDistribution: {
    helpful: number
    notHelpful: number
    noFeedback: number
  }
  escalationsByCategory: {
    category: string
    count: number
    percentage: number
  }[]
}
