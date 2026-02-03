import { requireAuth } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/dashboard/queries'
import { getUserActivity } from '@/lib/dashboard/activity-queries'
import { getTicketVolumeTrend, getTicketsByPriority } from '@/lib/dashboard/chart-queries'
import { formatStatValue, formatSatisfactionValue } from '@/lib/format'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TrendChart } from '@/components/analytics/trend-chart'
import { CategoryChart } from '@/components/analytics/category-chart'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Link from 'next/link'

export default async function DashboardPage() {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    logger.error('Auth error in dashboard', { error: error instanceof Error ? error.message : 'Unknown error' })
    throw error
  }

  const isStaff = ['staff', 'admin', 'super_admin'].includes(user.role)

  // Fetch stats, activity, and chart data in parallel
  const [statsResult, activityResult, volumeResult, priorityResult] = await Promise.allSettled([
    getDashboardStats(user.id),
    getUserActivity(user.id, { limit: 10 }),
    getTicketVolumeTrend(user.id, isStaff),
    getTicketsByPriority(user.id, isStaff),
  ])

  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
  const statsError = statsResult.status === 'rejected' ? statsResult.reason : null
  
  const activity = activityResult.status === 'fulfilled' ? activityResult.value : []
  const activityError = activityResult.status === 'rejected' ? activityResult.reason : null

  const ticketVolume = volumeResult.status === 'fulfilled' ? volumeResult.value : []
  const ticketsByPriority = priorityResult.status === 'fulfilled' ? priorityResult.value : []

  // Log errors for debugging
  if (statsError) {
    logger.error('Dashboard stats error', { 
      error: statsError instanceof Error ? statsError.message : 'Unknown error',
      stack: statsError instanceof Error ? statsError.stack : undefined
    })
  }
  
  if (activityError) {
    logger.error('Dashboard activity error', { 
      error: activityError instanceof Error ? activityError.message : 'Unknown error',
      stack: activityError instanceof Error ? activityError.stack : undefined
    })
  }

  return (
    <div className="space-y-6 p-1">
      {/* Welcome Banner - Full Width */}
      <div className="w-full">
        <WelcomeBanner user={user} />
      </div>
      
      {/* Error Alerts */}
      <div className="space-y-4">
        {statsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Statistics</AlertTitle>
            <AlertDescription>
              {statsError instanceof Error ? statsError.message : 'Failed to load statistics'}
            </AlertDescription>
          </Alert>
        )}
        
        {activityError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Activity</AlertTitle>
            <AlertDescription>
              {activityError instanceof Error ? activityError.message : 'Failed to load recent activity'}
            </AlertDescription>
          </Alert>
        )}

        {/* Overdue Tickets Alert */}
        {stats && stats.overdueTickets > 0 && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/50 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">
              Overdue Tickets
            </AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              You have {stats.overdueTickets} ticket{stats.overdueTickets > 1 ? 's' : ''} past
              {stats.overdueTickets > 1 ? ' their' : ' its'} SLA deadline.
              <Link
                href="/tickets?status=open&status=in_progress&timePeriod=all"
                className="ml-2 underline font-medium hover:text-orange-900 dark:hover:text-orange-100"
              >
                Review now →
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Stats Column - Spans 12 cols on mobile, 8 on desktop */}
        <div className="md:col-span-8 space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Open Tickets"
              value={formatStatValue(stats?.openTickets)}
              icon="Ticket"
              loading={!stats && !statsError}
              variant="default"
              description="Active tickets requiring attention"
            />
            <StatsCard
              title="Resolved Today"
              value={formatStatValue(stats?.resolvedTickets)}
              icon="CheckCircle"
              loading={!stats && !statsError}
              variant="default"
              description="Tickets closed in the last 24h"
            />
          </div>
          
          {/* Secondary Metrics Row - Employee: status cards; Staff: Avg Response Time + Satisfaction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isStaff ? (
              <>
                <StatsCard
                  title="Avg Response Time"
                  value={stats?.avgResponseTime || '-'}
                  icon="Clock"
                  loading={!stats && !statsError}
                  variant="warning"
                  description="Average time to first response"
                />
                <StatsCard
                  title="Satisfaction"
                  value={formatSatisfactionValue(stats?.satisfaction)}
                  icon="Star"
                  loading={!stats && !statsError}
                  variant="default"
                  description="Average customer rating"
                />
              </>
            ) : (
              <>
                <StatsCard
                  title="In Progress"
                  value={formatStatValue(stats?.inProgressCount)}
                  icon="RotateCw"
                  loading={!stats && !statsError}
                  variant="default"
                  description="Tickets being worked on"
                />
                <StatsCard
                  title="On Hold"
                  value={formatStatValue(stats?.onHoldCount)}
                  icon="PauseCircle"
                  loading={!stats && !statsError}
                  variant="default"
                  description="Waiting for something"
                />
                <StatsCard
                  title="Resolved"
                  value={formatStatValue(stats?.resolvedCount)}
                  icon="CheckCircle"
                  loading={!stats && !statsError}
                  variant="default"
                  description="Completed, awaiting confirmation"
                />
                <StatsCard
                  title="Cancelled"
                  value={formatStatValue(stats?.canceledCount)}
                  icon="XCircle"
                  loading={!stats && !statsError}
                  variant="default"
                  description="No longer needed"
                />
              </>
            )}
          </div>

          {/* Ticket Volume Trend Chart */}
          <TrendChart
            title="Ticket Volume"
            description="Tickets created over the last 7 days"
            data={ticketVolume}
            dataKey="value"
            nameKey="name"
            variant="area"
            color="#3b82f6"
            height={300}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
          />
        </div>

        {/* Sidebar Column - Spans 12 cols on mobile, 4 on desktop */}
        <div className="md:col-span-4 space-y-6">
          {/* Tickets by Priority Chart */}
          <CategoryChart
            title="Tickets by Priority"
            description="Distribution of open tickets"
            data={ticketsByPriority}
            variant="donut"
            height={250}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
            showLegend={true}
            showPercentage={false}
          />

          {/* Recent Activity */}
          <RecentActivity items={activity} />
          
          {/* Future: Add more widgets here like "My Tasks" or "System Status" */}
        </div>
      </div>
    </div>
  )
}
