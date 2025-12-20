/**
 * Admin Layout
 *
 * Layout for admin pages with access control
 * Only accessible to admin and super_admin roles
 */

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require authentication
  const user = await requireAuth()

  // Verify admin/super_admin role
  const supabase = await createClient()
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !userData || !['admin', 'super_admin'].includes(userData.role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
