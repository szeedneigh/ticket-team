import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyPerformanceMetrics } from '@/lib/analytics/queries'
import { MyPerformanceContent } from '@/components/analytics/my-performance-content'
import { PerformanceTimeFilter } from '@/components/analytics/performance-time-filter'
import { Skeleton } from '@/components/ui/skeleton'
import { getTimePeriodStartDate } from '@/lib/constants'
import type { TimePeriod } from '@/lib/types/tickets'
import { TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'My Performance',
  description: 'View your personal performance metrics and achievements',
}

interface PageProps {
  searchParams: Promise<{
    timePeriod?: string
  }>
}

async function MyPerformanceData({ searchParams }: PageProps) {
  const params = await searchParams
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

  // Calculate date range based on filter
  const end = new Date()
  const timePeriod = (params.timePeriod as TimePeriod) || 'this_month'
  const startDateStr = getTimePeriodStartDate(timePeriod)
  
  // If 'all' is selected (startDateStr is null), we use a very old date or handle differently
  // Since query expects a range, let's pick a reasonable default "all time" start if null, e.g. 5 years ago
  const start = startDateStr ? new Date(startDateStr) : new Date(new Date().setFullYear(new Date().getFullYear() - 5))

  // Fetch personal performance data
  const performance = await getMyPerformanceMetrics(user.id, { start, end })

  if (!performance) {
    redirect('/dashboard')
  }

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
    <div className="space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

export default function MyPerformancePage({ searchParams }: PageProps) {
  return (
    <div className="min-h-full bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Header Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                My Performance
              </h1>
              <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 max-w-2xl">
                Track your personal metrics, response times, and satisfaction scores.
                <TrendingUp className="h-4 w-4 text-[#2cafdd]" />
              </p>
            </div>
          </div>
            
          {/* Controls Section - Integrated into Hero */}
          <div className="flex flex-col gap-6 bg-background/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-[#1f3463]/5">
            <div className="flex items-center justify-between w-full">
               <span className="text-sm font-medium text-muted-foreground">Period Selection</span>
               <div className="flex items-center gap-3">
                <Suspense fallback={<Skeleton className="h-10 w-[150px]" />}>
                  <PerformanceTimeFilter defaultValue="this_month" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl relative z-20">
        <Suspense fallback={<MyPerformanceLoading />}>
          <MyPerformanceData searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

