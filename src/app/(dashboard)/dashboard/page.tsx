import { requireAuth } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/dashboard/queries'
import { getUserActivity } from '@/lib/dashboard/activity-queries'
import { formatStatValue, formatSatisfactionValue } from '@/lib/format'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

export default async function DashboardPage() {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    logger.error('Auth error in dashboard', { error: error instanceof Error ? error.message : 'Unknown error' })
    throw error
  }

  // Fetch stats and activity in parallel
  const [statsResult, activityResult] = await Promise.allSettled([
    getDashboardStats(user.id),
    getUserActivity(user.id, { limit: 10 }),
  ])

  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
  const statsError = statsResult.status === 'rejected' ? statsResult.reason : null
  
  const activity = activityResult.status === 'fulfilled' ? activityResult.value : []
  const activityError = activityResult.status === 'rejected' ? activityResult.reason : null

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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <WelcomeBanner user={user} />
      
      {/* Error Alerts */}
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Open Tickets"
          value={formatStatValue(stats?.openTickets)}
          icon="Ticket"
          loading={!stats && !statsError}
        />
        <StatsCard
          title="Resolved Today"
          value={formatStatValue(stats?.resolvedTickets)}
          icon="CheckCircle"
          loading={!stats && !statsError}
        />
        <StatsCard
          title="Avg Response Time"
          value={stats?.avgResponseTime || '-'}
          icon="Clock"
          loading={!stats && !statsError}
        />
        <StatsCard
          title="Satisfaction"
          value={formatSatisfactionValue(stats?.satisfaction)}
          icon="Star"
          loading={!stats && !statsError}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions user={user} />

      {/* Recent Activity */}
      <RecentActivity items={activity} />
    </div>
  )
}
