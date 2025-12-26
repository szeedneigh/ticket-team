/**
 * AI Observability Page
 *
 * Technical observability metrics for AI system performance, including
 * response times, error rates, token usage, and model performance.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAIAnalytics } from '@/lib/analytics/queries'
import { AIObservabilityContent } from '@/components/analytics/ai-observability-content'
import { Skeleton } from '@/components/ui/skeleton'
import { getTimePeriodStartDate } from '@/lib/constants'
import type { TimePeriod } from '@/lib/types/tickets'

export const metadata = {
  title: 'Analytics - AI Observability',
  description: 'AI system performance monitoring and observability metrics',
}

interface PageProps {
  searchParams: Promise<{
    timePeriod?: string
  }>
}

async function AIObservabilityData({ searchParams }: PageProps) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/sign-in')
  }

  // Verify user role (admin or super_admin only)
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

  // Calculate date range based on filter
  const params = await searchParams
  const end = new Date()
  const timePeriod = (params.timePeriod as TimePeriod) || 'this_month'
  const startDateStr = getTimePeriodStartDate(timePeriod)
  const start = startDateStr ? new Date(startDateStr) : new Date(new Date().setFullYear(new Date().getFullYear() - 1))

  // Fetch AI analytics data
  const aiData = await getAIAnalytics(user.id, { start, end })

  return (
    <AIObservabilityContent
      aiData={aiData}
      dateRange={{
        start: start.toISOString(),
        end: end.toISOString(),
      }}
    />
  )
}

// Loading skeleton - only content, navigation is in layout
function AIObservabilityLoading() {
  return (
    <div className="space-y-6">
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

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AIObservabilityPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<AIObservabilityLoading />}>
      <AIObservabilityData searchParams={searchParams} />
    </Suspense>
  )
}
