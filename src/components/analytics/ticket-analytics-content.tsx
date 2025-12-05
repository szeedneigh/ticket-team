/**
 * Ticket Analytics Content Component (Client)
 *
 * Contains all the interactive chart components with custom formatters.
 * Extracted as a client component to avoid passing functions from server to client.
 */

'use client'

import {
  KPICard,
  KPICardGrid,
  TrendChart,
  CategoryChart,
  BarChart,
  ExportButton,
} from '@/components/analytics'
import { TicketIcon, TrendingUpIcon, AlertCircleIcon, ClockIcon } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into ticket patterns and trends
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* KPI Cards */}
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

      {/* Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Ticket Volume Trend"
          description="Daily ticket creation"
          data={trends.ticketVolume}
          variant="area"
          color="hsl(var(--primary))"
          height={300}
        />
        <TrendChart
          title="Resolution Rate Trend"
          description="Daily resolution rate percentage"
          data={trends.resolutionRate}
          variant="line"
          color="hsl(var(--chart-2))"
          height={300}
          formatTooltip={(value) => `${value}%`}
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priority Distribution */}
        <CategoryChart
          title="Priority Distribution"
          description="Tickets by priority level"
          data={priorityDist.map((p) => ({
            name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
            value: p.count,
            color:
              p.priority === 'high'
                ? '#ef4444'
                : p.priority === 'medium'
                  ? '#f59e0b'
                  : '#10b981',
          }))}
          variant="pie"
          showLegend={true}
          height={300}
        />

        {/* Status Distribution */}
        <CategoryChart
          title="Status Distribution"
          description="Tickets by current status"
          data={statusDist.map((s) => ({
            name: s.status.replace('_', ' ').charAt(0).toUpperCase() + s.status.slice(1),
            value: s.count,
          }))}
          variant="donut"
          showLegend={true}
          height={300}
        />
      </div>

      {/* Peak Hours Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart
          title="Peak Hours"
          description="Tickets created by hour of day"
          data={peakHours.hourly}
          dataKey="count"
          nameKey="label"
          height={300}
        />
        <BarChart
          title="Peak Days"
          description="Tickets created by day of week"
          data={peakHours.daily}
          dataKey="count"
          nameKey="label"
          height={300}
          color="hsl(var(--chart-3))"
        />
      </div>

      {/* Priority Performance Table */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Priority Performance</h3>
          <p className="text-sm text-muted-foreground">
            Resolution metrics by priority level
          </p>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {priorityDist.map((priority) => (
              <div
                key={priority.priority}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        priority.priority === 'high'
                          ? '#ef4444'
                          : priority.priority === 'medium'
                            ? '#f59e0b'
                            : '#10b981',
                    }}
                  />
                  <span className="font-medium capitalize">{priority.priority}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{priority.count}</p>
                    <p className="text-muted-foreground">tickets</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{priority.percentage}%</p>
                    <p className="text-muted-foreground">of total</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{priority.avgResolutionTime}</p>
                    <p className="text-muted-foreground">avg resolution</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

