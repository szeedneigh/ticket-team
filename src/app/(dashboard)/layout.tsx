import { requireAuth } from '@/lib/auth/session'
import { PresenceTracker } from '@/components/shared/presence-tracker'
import { DashboardLayoutWrapper } from '@/components/shared/dashboard-layout-wrapper'
import { HydrationBoundary } from '@/components/shared/hydration-boundary'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <PresenceTracker user={user} />
      <HydrationBoundary>
        <DashboardLayoutWrapper user={user}>
          {children}
        </DashboardLayoutWrapper>
      </HydrationBoundary>
      {/* <Footer /> */}
    </div>
  )
}
