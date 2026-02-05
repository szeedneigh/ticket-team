/**
 * Analytics Overview Page
 *
 * Premium analytics dashboard with glassmorphism design,
 * hero section, and modern KPI cards.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsSummary, getTicketTrends, getCategoryDistribution } from '@/lib/analytics/queries'
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
  TrendingUpIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  Sparkles,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getChartColor } from '@/lib/constants/colors'
import { getSatisfactionEmoji } from '@/lib/constants/satisfaction-emojis'

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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0693D2]/10 via-white/50 to-violet-500/5 dark:from-[#0693D2]/20 dark:via-slate-900/50 dark:to-violet-500/10 border border-white/30 dark:border-white/10 p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#0693D2]/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0693D2] to-[#0570A6] shadow-lg">
              <BarChart3Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Live Data
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive insights and performance metrics for the last 30 days
          </p>
        </div>
      </div>

      {/* Primary KPI Cards */}
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
          icon={<span className="text-lg" aria-hidden="true">{getSatisfactionEmoji(Math.round(summary.satisfactionScore))}</span>}
          variant={summary.satisfactionScore >= 4 ? 'success' : summary.satisfactionScore >= 3 ? 'warning' : 'danger'}
        />
      </KPICardGrid>

      {/* Secondary KPI Cards */}
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
          color="#0693D2"
          showGrid={true}
          height={320}
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
          height={320}
          centerLabel="Total"
          centerValue={categoryDist.reduce((sum, cat) => sum + cat.count, 0)}
        />
      </div>

      {/* Category Performance Cards */}
        <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Category Performance</h2>
          <span className="text-sm text-muted-foreground">Resolution time and ticket count by category</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryDist.map((cat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Accent bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{ backgroundColor: getChartColor(index) }}
              />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
                    style={{ backgroundColor: `${getChartColor(index)}15` }}
                  >
                    <BarChart3Icon 
                      className="h-5 w-5" 
                      style={{ color: getChartColor(index) }}
                    />
                  </div>
                  <span className="font-semibold text-foreground">{cat.category}</span>
                </div>
                <span 
                  className="text-2xl font-bold"
                  style={{ color: getChartColor(index) }}
                >
                  {cat.percentage}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tickets</p>
                  <p className="text-base font-semibold">{cat.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Resolution</p>
                  <p className="text-base font-semibold">{cat.avgResolutionTime}</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${cat.percentage}%`,
                    backgroundColor: getChartColor(index)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Loading skeleton - only content, navigation is handled by layout
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="rounded-3xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      
      {/* KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Secondary KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Category Performance skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoadingSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  )
}
