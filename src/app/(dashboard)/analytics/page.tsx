/**
 * Analytics Overview Page
 *
 * Main analytics dashboard showing KPIs, trends, and distributions.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsSummary, getTicketTrends, getCategoryDistribution } from '@/lib/analytics/queries'
import { AnalyticsLayout } from '@/components/analytics/analytics-layout'
import {
  KPICard,
  KPICardGrid,
  LazyTrendChart,
  LazyCategoryChart,
} from '@/components/analytics'
import {
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  BarChartIcon,
  PieChartIcon,
} from 'lucide-react'

export const metadata = {
  title: 'Analytics - Overview',
  description: 'Analytics and reporting dashboard',
}

async function AnalyticsContent() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/sign-in')
  }

  // Verify user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    redirect('/dashboard')
  }

  // Check if user is admin or super_admin
  if (!['admin', 'super_admin'].includes(userData.role)) {
    redirect('/dashboard')
  }

  // Fetch analytics data (last 30 days by default)
  const [summary, trends, categoryDist] = await Promise.all([
    getAnalyticsSummary(user.id),
    getTicketTrends(user.id, undefined, 'daily'),
    getCategoryDistribution(user.id),
  ])

  return (
    <AnalyticsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>

        {/* KPI Cards */}
        <KPICardGrid>
          <KPICard
            title="Total Tickets"
            value={summary.totalTickets.toLocaleString()}
            description={`${summary.period.start.split('T')[0]} to ${summary.period.end.split('T')[0]}`}
            icon={<TicketIcon className="h-4 w-4" />}
            variant="default"
          />
          <KPICard
            title="Resolution Rate"
            value={`${summary.resolutionRate}%`}
            description={`${summary.resolvedTickets + summary.closedTickets} resolved`}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            variant={summary.resolutionRate >= 80 ? 'success' : summary.resolutionRate >= 60 ? 'warning' : 'danger'}
          />
          <KPICard
            title="Avg Response Time"
            value={summary.avgResponseTime}
            description="Time to first staff response"
            icon={<ClockIcon className="h-4 w-4" />}
            variant="info"
          />
          <KPICard
            title="Satisfaction Score"
            value={`${summary.satisfactionScore.toFixed(1)}/5.0`}
            description="Customer satisfaction rating"
            icon={<StarIcon className="h-4 w-4" />}
            variant={summary.satisfactionScore >= 4 ? 'success' : summary.satisfactionScore >= 3 ? 'warning' : 'danger'}
          />
        </KPICardGrid>

        {/* Secondary KPIs */}
        <KPICardGrid>
          <KPICard
            title="Open Tickets"
            value={summary.openTickets.toLocaleString()}
            description="Currently open"
            icon={<TicketIcon className="h-4 w-4" />}
            variant="info"
          />
          <KPICard
            title="Avg Resolution Time"
            value={summary.avgResolutionTime}
            description="Average time to resolve"
            icon={<TrendingUpIcon className="h-4 w-4" />}
          />
          <KPICard
            title="SLA Compliance"
            value={`${summary.slaCompliance}%`}
            description="Within SLA targets"
            icon={<CheckCircleIcon className="h-4 w-4" />}
            variant={summary.slaCompliance >= 90 ? 'success' : summary.slaCompliance >= 75 ? 'warning' : 'danger'}
          />
          <KPICard
            title="Overdue Tickets"
            value={summary.overdueTickets.toLocaleString()}
            description="Past SLA deadline"
            icon={<AlertTriangleIcon className="h-4 w-4" />}
            variant={summary.overdueTickets === 0 ? 'success' : summary.overdueTickets < 5 ? 'warning' : 'danger'}
          />
        </KPICardGrid>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ticket Volume Trend */}
          <LazyTrendChart
            title="Ticket Volume Trend"
            description="Daily ticket creation over the last 30 days"
            data={trends.ticketVolume}
            variant="area"
            color="hsl(var(--primary))"
            showGrid={true}
            height={300}
          />

          {/* Category Distribution */}
          <LazyCategoryChart
            title="Category Distribution"
            description="Tickets by category"
            data={categoryDist.map((cat) => ({
              name: cat.category,
              value: cat.count,
            }))}
            variant="donut"
            showLegend={true}
            showPercentage={true}
            height={300}
          />
        </div>

        {/* Category Performance Table */}
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h3 className="font-semibold">Category Performance</h3>
            <p className="text-sm text-muted-foreground">
              Resolution time and ticket count by category
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {categoryDist.map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cat.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-medium">{cat.count}</p>
                      <p className="text-muted-foreground">tickets</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{cat.avgResolutionTime}</p>
                      <p className="text-muted-foreground">avg resolution</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{cat.percentage}%</p>
                      <p className="text-muted-foreground">of total</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <AnalyticsLayout>
          <div className="space-y-6">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </AnalyticsLayout>
      }
    >
      <AnalyticsContent />
    </Suspense>
  )
}
