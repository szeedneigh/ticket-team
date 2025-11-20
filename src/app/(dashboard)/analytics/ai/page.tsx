/**
 * AI Chat Analytics Page
 *
 * Analytics for AI chat interactions, helpfulness, and escalation rates.
 * Accessible only to admin and super_admin roles.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAIAnalytics } from '@/lib/analytics/queries'
import { AnalyticsLayout } from '@/components/analytics/analytics-layout'
import { AIAnalyticsContent } from '@/components/analytics/ai-analytics-content'

export const metadata = {
  title: 'Analytics - AI Chat',
  description: 'AI chat interaction analytics and performance metrics',
}

async function AIAnalyticsData() {
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

  // Fetch AI analytics data
  const aiData = await getAIAnalytics(user.id)

  return (
    <AnalyticsLayout>
      <AIAnalyticsContent aiData={aiData} />
    </AnalyticsLayout>
  )
}

export default function AIAnalyticsPage() {
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
      <AIAnalyticsData />
    </Suspense>
  )
}
