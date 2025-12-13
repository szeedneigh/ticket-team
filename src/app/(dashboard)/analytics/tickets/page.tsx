/**
 * Ticket Analytics Page
 *
 * Detailed analytics focused on ticket metrics and trends.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getAnalyticsSummary,
  getTicketTrends,
  getPriorityDistribution,
  getStatusDistribution,
  getPeakHoursAnalysis,
} from '@/lib/analytics/queries'
import { TicketAnalyticsContent } from '@/components/analytics/ticket-analytics-content'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Analytics - Tickets',
  description: 'Detailed ticket analytics and trends',
}

async function TicketAnalyticsData() {
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

  // Fetch ticket analytics data
  const [summary, trends, priorityDist, statusDist, peakHours] = await Promise.all([
    getAnalyticsSummary(user.id),
    getTicketTrends(user.id, undefined, 'daily'),
    getPriorityDistribution(user.id),
    getStatusDistribution(user.id),
    getPeakHoursAnalysis(user.id),
  ])

  return (
    <TicketAnalyticsContent
      summary={summary}
      trends={trends}
      priorityDist={priorityDist}
      statusDist={statusDist}
      peakHours={peakHours}
    />
  )
}

// Loading skeleton - only content, navigation is in layout
function TicketAnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
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
      
      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TicketAnalyticsPage() {
  return (
    <Suspense fallback={<TicketAnalyticsLoading />}>
      <TicketAnalyticsData />
    </Suspense>
  )
}
