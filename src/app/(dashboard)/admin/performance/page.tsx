/**
 * System Performance Monitoring Page
 *
 * System-wide performance metrics including page load times,
 * API response times, database query performance, and error rates.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { SystemPerformanceContent } from '@/components/analytics/system-performance-content'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity } from 'lucide-react'

export const metadata = {
  title: 'System Performance | Admin',
  description: 'Monitor system-wide performance metrics and health',
}

// Loading skeleton
function SystemPerformanceLoading() {
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

export default function SystemPerformancePage() {
  return (
    <div className="min-h-full bg-background relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                System Performance
              </h1>
              <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 max-w-2xl">
                Monitor system-wide performance metrics, API response times, and application health.
                <Activity className="h-4 w-4 text-[#2cafdd]" />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Suspense fallback={<SystemPerformanceLoading />}>
          <SystemPerformanceContent />
        </Suspense>
      </div>
    </div>
  )
}

