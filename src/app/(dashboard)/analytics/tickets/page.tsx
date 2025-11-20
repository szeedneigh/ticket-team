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
    <AnalyticsLayout>
      <TicketAnalyticsContent
        summary={summary}
        trends={trends}
        priorityDist={priorityDist}
        statusDist={statusDist}
        peakHours={peakHours}
      />
    </AnalyticsLayout>
  )
}

export default function TicketAnalyticsPage() {
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
      <TicketAnalyticsData />
    </Suspense>
  )
}
