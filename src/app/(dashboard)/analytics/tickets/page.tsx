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
import { AnalyticsLayout } from '@/components/analytics/analytics-layout'
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
    <div className="min-h-screen relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      
      <AnalyticsLayout>
        <TicketAnalyticsContent
          summary={summary}
          trends={trends}
          priorityDist={priorityDist}
          statusDist={statusDist}
          peakHours={peakHours}
        />
      </AnalyticsLayout>
    </div>
  )
}

// Loading skeleton
function TicketAnalyticsLoading() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      
      <div className="space-y-8 p-6">
        {/* Navigation skeleton */}
        <Skeleton className="h-14 w-full rounded-2xl bg-white/50" />
        
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
            <div key={i} className="rounded-2xl bg-white/50 backdrop-blur-xl border border-white/30 p-5 space-y-3">
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
            <div key={i} className="rounded-2xl bg-white/50 backdrop-blur-xl border border-white/30 p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </div>
          ))}
        </div>
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
