/**
 * Staff Performance Analytics Page
 *
 * Detailed analytics on staff performance and workload distribution.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getAnalyticsSummary,
  getStaffPerformanceMetrics,
} from '@/lib/analytics/queries'
import { AnalyticsLayout } from '@/components/analytics/analytics-layout'
import { StaffPerformanceContent } from '@/components/analytics/staff-performance-content'

export const metadata = {
  title: 'Analytics - Staff Performance',
  description: 'Staff performance metrics and workload analysis',
}

async function StaffPerformanceData() {
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

  if (!['admin', 'super_admin'].includes(userData.role)) {
    redirect('/dashboard')
  }

  // Fetch staff performance data
  const [summary, staffPerformance] = await Promise.all([
    getAnalyticsSummary(user.id),
    getStaffPerformanceMetrics(user.id),
  ])

  return (
    <AnalyticsLayout>
      <StaffPerformanceContent
        summary={summary}
        staffPerformance={staffPerformance}
      />
    </AnalyticsLayout>
  )
}

export default function StaffPerformancePage() {
  return (
    <Suspense
      fallback={
        <AnalyticsLayout>
          <div className="space-y-6">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </AnalyticsLayout>
      }
    >
      <StaffPerformanceData />
    </Suspense>
  )
}
