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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 text-center shadow-lg">
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold">
            No departments available
          </h1>
          <p className="text-muted-foreground">
            Please contact your administrator to set up departments.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Ticket Team
          </h1>
          <p className="text-muted-foreground">
            Please select your department to continue
          </p>
        </div>

        <DepartmentSelectionForm
          departments={activeDepartments}
          userName={user.full_name}
        />
      </div>
    </div>
  )
}

