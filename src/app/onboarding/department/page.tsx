/**
 * Department Onboarding Page
 *
 * One-time onboarding page for new users to select their department.
 * Redirects to dashboard if user already has a department.
 *
 * @module app/onboarding/department/page
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'
import { getDepartments } from '@/lib/departments/actions'
import { DepartmentSelectionForm } from '@/components/onboarding/department-selection-form'
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout'

export default async function DepartmentOnboardingPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Check if user already has a department
  const { data: userData } = await supabase
    .from('users')
    .select('department')
    .eq('id', user.id)
    .single()

  // If user already has a department, redirect to dashboard
  if (userData?.department) {
    redirect('/dashboard')
  }

  // Fetch active departments
  const { data: departments, error } = await getDepartments()

  if (error || !departments) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-destructive">
            Error loading departments
          </h1>
          <p className="text-muted-foreground">
            {error || 'Failed to load departments. Please try again later.'}
          </p>
        </div>
      </div>
    )
  }

  const activeDepartments = departments.filter((dept) => dept.is_active)

  if (activeDepartments.length === 0) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold">No departments available</h1>
          <p className="text-muted-foreground">
            Please contact your administrator to set up departments.
          </p>
        </div>
      </div>
    )
  }

  return (
    <OnboardingLayout>
      <div className="bg-background rounded-2xl shadow-xl shadow-[#1f3463]/5 ring-1 ring-white/10 dark:ring-white/5 p-6 sm:p-8 border border-white/10">
        <div className="space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#0693D2] dark:text-white dark:bg-none">
            Welcome to Ticket Team
          </h1>
          <p className="text-muted-foreground text-sm">
            Select your department to continue
          </p>
        </div>

        <DepartmentSelectionForm
          departments={activeDepartments}
          userName={user.full_name}
        />
      </div>
    </OnboardingLayout>
  )
}
