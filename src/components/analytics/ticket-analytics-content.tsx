/**
 * Ticket Analytics Content Component (Client)
 *
 * Premium ticket analytics with glassmorphism styling,
 * semantic colors, and modern chart presentations.
 */

'use client'

import { motion } from 'framer-motion'
import {
  KPICard,
  KPICardGrid,
  TrendChart,
  CategoryChart,
  BarChart,
  ExportButton,
} from '@/components/analytics'
import { TicketIcon, TrendingUpIcon, AlertCircleIcon, ClockIcon, BarChart3Icon } from 'lucide-react'
import { exportTicketAnalytics } from '@/lib/analytics/export'
import type { ExportFormat } from '@/lib/types/analytics'

interface TicketAnalyticsContentProps {
  summary: {
    totalTickets: number
    openTickets: number
    resolutionRate: number
    avgResolutionTime: string
  }
  trends: {
    ticketVolume: Array<{ date: string; value: number }>
    resolutionRate: Array<{ date: string; value: number }>
  }
  priorityDist: Array<{
    priority: string
    count: number
    percentage: number
    avgResolutionTime: string
  }>
  statusDist: Array<{
    status: string
    count: number
  }>
  peakHours: {
    hourly: Array<{ label: string; count: number }>
    daily: Array<{ label: string; count: number }>
  }
}

// Semantic colors for priorities
const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b', 
  low: '#10b981',
}

// Semantic colors for statuses
const STATUS_COLORS = ['#0693D2', '#8b5cf6', '#10b981', '#6b7280']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function TicketAnalyticsContent({
  summary,
  trends,
  priorityDist,
  statusDist,
  peakHours,
}: TicketAnalyticsContentProps) {
  const handleExport = async (format: ExportFormat) => {
    exportTicketAnalytics(format, {
      summary: {
        totalTickets: summary.totalTickets,
        openTickets: summary.openTickets,
        resolvedTickets: 0,
        closedTickets: 0,
        avgResolutionTime: summary.avgResolutionTime,
        avgResolutionTimeHours: 0,
        avgResponseTime: '-',
        avgResponseTimeHours: 0,
        satisfactionScore: 0,
        resolutionRate: summary.resolutionRate,
        slaCompliance: 0,
        overdueTickets: 0,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      },
      priorityDist: priorityDist.map(p => ({
        priority: p.priority as 'low' | 'medium' | 'high',
        count: p.count,
        percentage: p.percentage,
        avgResolutionTime: p.avgResolutionTime,
        avgResolutionTimeHours: 0,
      })),
      statusDist: statusDist.map(s => ({
        status: s.status as 'open' | 'in_progress' | 'resolved' | 'closed',
        count: s.count,
        percentage: 0,
      })),
      peakHours: {
        hourly: peakHours.hourly.map(h => ({ hour: 0, count: h.count, label: h.label })),
        daily: peakHours.daily.map(d => ({ day: 0, count: d.count, label: d.label })),
      },
      trends: {
        ticketVolume: trends.ticketVolume,
        resolutionRate: trends.resolutionRate,
        avgResponseTime: [],
        satisfaction: [],
        granularity: 'daily',
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
    })
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0693D2] to-[#0570A6] shadow-lg">
            <TicketIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ticket Analytics</h1>
            <p className="text-muted-foreground">
              Detailed insights into ticket patterns and trends
            </p>
          </div>
        </div>
        <ExportButton onExport={handleExport} />
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <KPICardGrid>
          <KPICard
            title="Total Tickets"
            value={summary.totalTickets.toLocaleString()}
            description="Last 30 days"
            icon={<TicketIcon className="h-4 w-4" />}
          />
          <KPICard
            title="Open Tickets"
            value={summary.openTickets.toLocaleString()}
            description="Currently active"
            icon={<AlertCircleIcon className="h-4 w-4" />}
            variant="info"
          />
          <KPICard
            title="Resolution Rate"
            value={`${summary.resolutionRate}%`}
            description="Successfully resolved"
            icon={<TrendingUpIcon className="h-4 w-4" />}
            variant={summary.resolutionRate >= 80 ? 'success' : 'warning'}
          />
          <KPICard
            title="Avg Resolution Time"
            value={summary.avgResolutionTime}
            description="Time to resolve"
            icon={<ClockIcon className="h-4 w-4" />}
          />
        </KPICardGrid>
      </motion.div>

      {/* Trends */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        <TrendChart
          title="Ticket Volume Trend"
          description="Daily ticket creation"
          data={trends.ticketVolume}
          variant="area"
          color="#0693D2"
          height={320}
        />
        <TrendChart
          title="Resolution Rate Trend"
          description="Daily resolution rate percentage"
          data={trends.resolutionRate}
          variant="line"
          color="#10b981"
          height={320}
          formatTooltip={(value) => `${value}%`}
        />
      </motion.div>

      {/* Distribution Charts */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        {/* Priority Distribution */}
        <CategoryChart
          title="Priority Distribution"
          description="Tickets by priority level"
          data={priorityDist.map((p) => ({
            name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
            value: p.count,
            color: PRIORITY_COLORS[p.priority as keyof typeof PRIORITY_COLORS] || '#6b7280',
          }))}
          variant="pie"
          showLegend={true}
          height={320}
        />

        {/* Status Distribution */}
        <CategoryChart
          title="Status Distribution"
          description="Tickets by current status"
          data={statusDist.map((s, index) => ({
            name: s.status.replace('_', ' ').charAt(0).toUpperCase() + s.status.replace('_', ' ').slice(1),
            value: s.count,
            color: STATUS_COLORS[index % STATUS_COLORS.length],
          }))}
          variant="donut"
          showLegend={true}
          height={320}
          centerLabel="Total"
          centerValue={statusDist.reduce((sum, s) => sum + s.count, 0)}
        />
      </motion.div>

      {/* Peak Hours Analysis */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        <BarChart
          title="Peak Hours"
          description="Tickets created by hour of day"
          data={peakHours.hourly}
          dataKey="count"
          nameKey="label"
          height={320}
          color="#0693D2"
        />
        <BarChart
          title="Peak Days"
          description="Tickets created by day of week"
          data={peakHours.daily}
          dataKey="count"
          nameKey="label"
          height={320}
          color="#8b5cf6"
        />
      </motion.div>

      {/* Priority Performance Cards */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Priority Performance</h2>
          <span className="text-sm text-muted-foreground">Resolution metrics by priority level</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {priorityDist.map((priority) => {
            const color = PRIORITY_COLORS[priority.priority as keyof typeof PRIORITY_COLORS] || '#6b7280'
            return (
              <div
                key={priority.priority}
                className="group relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Accent bar */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: color }}
                />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-xl"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <BarChart3Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <span className="font-semibold capitalize">{priority.priority} Priority</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color }}>
                    {priority.percentage}%
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tickets</p>
                    <p className="text-lg font-semibold">{priority.count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Resolution</p>
                    <p className="text-lg font-semibold">{priority.avgResolutionTime}</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${priority.percentage}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
