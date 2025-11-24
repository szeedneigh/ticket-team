/**
 * Admin Layout
 *
 * Layout for admin pages with navigation and access control
 * Only accessible to admin and super_admin roles
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Users, LayoutDashboard, Settings, ChevronRight, FolderTree, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

  const adminNavItems = [
    {
      href: '/admin/users',
      label: 'User Management',
      icon: Users,
      description: 'Manage users and permissions',
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      icon: FolderTree,
      description: 'Manage ticket and KB categories',
    },
    {
      href: '/admin/audit',
      label: 'Audit Logs',
      icon: FileText,
      description: 'View system activity and changes',
    },
    {
      href: '/admin/settings',
      label: 'System Settings',
      icon: Settings,
      description: 'Configure system settings',
    },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Admin Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href="/dashboard"
                  className="hover:text-foreground"
                >
                  Dashboard
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">Admin</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold">Administration</h1>
            </div>

            <Link href="/dashboard">
              <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Admin Navigation */}
          <nav className="mt-6 flex gap-4">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative rounded-lg border bg-white p-4 transition-all hover:border-primary hover:shadow-md dark:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary">
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </div>
    </div>
  )
}
