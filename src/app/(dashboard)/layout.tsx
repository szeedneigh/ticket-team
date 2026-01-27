import { redirect } from 'next/navigation'
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

  // Check if user needs to complete department onboarding
  // Exclude the onboarding path itself to avoid redirect loop
  if (!user.department) {
    redirect('/onboarding/department')
  }

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
