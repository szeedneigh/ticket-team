/**
 * My Performance Page
 *
 * Individual staff performance dashboard - staff can view their own metrics
 * Accessible to staff, admin, and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyPerformanceMetrics } from '@/lib/analytics/queries'
import { MyPerformanceContent } from '@/components/analytics/my-performance-content'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'My Performance',
  description: 'View your personal performance metrics and achievements',
}

async function MyPerformanceData() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/sign-in')
  }

  // Verify user role (staff, admin, or super_admin)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    redirect('/dashboard')
  }

  if (!['staff', 'admin', 'super_admin'].includes(userData.role)) {
    redirect('/dashboard')
  }

  // Fetch personal performance data
  const performance = await getMyPerformanceMetrics(user.id)

  if (!performance) {
    redirect('/dashboard')
  }

  // Calculate date range for display
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30) // Last 30 days

  return (
    <MyPerformanceContent
      performance={performance}
      dateRange={{
        start: start.toISOString(),
        end: end.toISOString(),
      }}
    />
  )
}

// Loading skeleton
function MyPerformanceLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-16 w-48 rounded-xl" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 space-y-3"
          >
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Performance cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MyPerformancePage() {
  return (
    <Suspense fallback={<MyPerformanceLoading />}>
      <MyPerformanceData />
    </Suspense>
  )
}

