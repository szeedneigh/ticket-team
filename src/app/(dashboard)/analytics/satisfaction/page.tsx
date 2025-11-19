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
import { AnalyticsLayout } from '@/components/analytics/analytics-layout'
import { SatisfactionContent } from '@/components/analytics/satisfaction-content'

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

  return (
    <AnalyticsLayout>
      <SatisfactionContent satisfactionData={satisfactionData} />
    </AnalyticsLayout>
  )
}

export default function SatisfactionPage() {
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
      <SatisfactionData />
    </Suspense>
  )
}
