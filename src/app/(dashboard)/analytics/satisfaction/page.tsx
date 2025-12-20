/**
 * Satisfaction Analytics Page
 *
 * Customer satisfaction metrics and feedback analysis.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSatisfactionBreakdown } from '@/lib/analytics/queries'
import { SatisfactionContent } from '@/components/analytics/satisfaction-content'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Analytics - Satisfaction',
  description: 'Customer satisfaction metrics and feedback',
}

async function SatisfactionData() {
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

  // Fetch satisfaction data
  const satisfactionData = await getSatisfactionBreakdown(user.id)

  return <SatisfactionContent satisfactionData={satisfactionData} />
}

// Loading skeleton - only content, navigation is in layout
function SatisfactionLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
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
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ))}
      </div>
      
      {/* Rating breakdown skeleton */}
      <div className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SatisfactionPage() {
  return (
    <Suspense fallback={<SatisfactionLoading />}>
      <SatisfactionData />
    </Suspense>
  )
}
