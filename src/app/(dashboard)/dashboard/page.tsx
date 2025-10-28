import { requireAuth } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/dashboard/queries'
import { getUserActivity } from '@/lib/dashboard/activity-queries'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Fetch stats and activity in parallel
  const [statsResult, activityResult] = await Promise.allSettled([
    getDashboardStats(user.id),
    getUserActivity(user.id, { limit: 10 }),
  ])

  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
  const statsError = statsResult.status === 'rejected' ? statsResult.reason : null
  
  const activity = activityResult.status === 'fulfilled' ? activityResult.value : []
  const activityError = activityResult.status === 'rejected' ? activityResult.reason : null

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
          value={stats?.openTickets.toString() || '0'}
          icon="Ticket"
          loading={!stats && !statsError}
        />
        <StatsCard
          title="Resolved Today"
          value={stats?.resolvedTickets.toString() || '0'}
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
          value={(stats?.satisfaction ?? 0).toFixed(1)}
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
