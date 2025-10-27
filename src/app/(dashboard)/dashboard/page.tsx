import { requireAuth } from '@/lib/auth/session'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <WelcomeBanner user={user} />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Open Tickets"
          value="3"
          icon="Ticket"
          trend="+12%"
          trendDirection="up"
        />
        <StatsCard
          title="Resolved Today"
          value="7"
          icon="CheckCircle"
          trend="+5%"
          trendDirection="up"
        />
        <StatsCard
          title="Avg Response Time"
          value="2.4h"
          icon="Clock"
          trend="-15%"
          trendDirection="down"
        />
        <StatsCard
          title="Satisfaction"
          value="4.8"
          icon="Star"
          trend="+3%"
          trendDirection="up"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions user={user} />

      {/* Recent Activity */}
      <RecentActivity userId={user.id} />
    </div>
  )
}
