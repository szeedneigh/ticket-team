/**
 * Create New User Page
 *
 * Page for creating new user accounts
 * Accessible only to admin and super_admin roles
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForm } from '@/components/users'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types/users'
import { getDepartments } from '@/lib/departments/actions'
import type { Department } from '@/lib/departments/actions'

export default function NewUserPage() {
  const router = useRouter()
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin'>('admin')
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    void getDepartments().then((r) => {
      if (r.success && r.data) setDepartments(r.data)
    })
  }, [])

  // Fetch current user's role
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()

        if (data && (data.role === 'admin' || data.role === 'super_admin')) {
          setCurrentUserRole(data.role as 'admin' | 'super_admin')
        }
      }
    }

    fetchCurrentUserRole()
  }, [])

  const handleSuccess = (user?: User) => {
    // Navigate to the user list or the created user's detail page
    if (user) {
      router.push(`/admin/users/${user.id}`)
    } else {
      router.push('/admin/users')
    }
  }

  const handleCancel = () => {
    router.push('/admin/users')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/users')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New User</h2>
        <p className="text-muted-foreground">
          Add a new user account to the system
        </p>
      </div>

      {/* Create User Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Enter the details for the new user account. A welcome email will be sent to the user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="create"
            currentUserRole={currentUserRole}
            departments={departments}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="max-w-2xl border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Password & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>
            <strong>Initial Password:</strong> The password you set will be the user&apos;s initial
            login credentials. Encourage users to change their password after first login.
          </p>
          <p>
            <strong>Email Verification:</strong> The email address must be from the @laverdad.edu.ph
            or @student.laverdad.edu.ph domain.
          </p>
          <p>
            <strong>Role Permissions:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Employee:</strong> Can submit tickets and view their own tickets
            </li>
            <li>
              <strong>Staff:</strong> Can manage assigned tickets and create knowledge base articles
            </li>
            <li>
              <strong>Admin:</strong> Can manage users (except super admins) and view analytics
            </li>
            {currentUserRole === 'super_admin' && (
              <li>
                <strong>Super Admin:</strong> Full system access including all admin functions
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
