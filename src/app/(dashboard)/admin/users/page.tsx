/**
 * User Management Page
 *
 * Main page for managing users with filtering, searching, and bulk actions
 * Accessible only to admin and super_admin roles
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Download, UserCog, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UserTable, UserFilters } from '@/components/users'
import { createClient } from '@/lib/supabase/client'
import { getAllUsers, getDepartments } from '@/lib/users/queries'
import { bulkUpdateUsers } from '@/app/actions/users'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'

export default function UsersPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin'>('admin')
  const [departments, setDepartments] = useState<string[]>([])

  const [filters, setFilters] = useState<{
    search?: string
    role?: UserRole
    department?: string
    is_active?: boolean
  }>({})

  // Bulk action dialog state
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean
    action: string
    userIds: string[]
  }>({ open: false, action: '', userIds: [] })
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee')
  const [isBulkLoading, setIsBulkLoading] = useState(false)

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

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const supabase = createClient()
        const depts = await getDepartments(supabase)
        setDepartments(depts)
      } catch (error) {
        console.error('Error fetching departments:', error)
      }
    }

    fetchDepartments()
  }, [])

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const result = await getAllUsers(supabase, filters, page, perPage)

      setUsers(result.users)
      setTotal(result.total)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch users when filters or page changes
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleEdit = (user: User) => {
    router.push(`/admin/users/${user.id}`)
  }

  const handleBulkAction = async (userIds: string[], action: string) => {
    // Open dialog for confirmation
    setBulkActionDialog({ open: true, action, userIds })
  }

  const executeBulkAction = async () => {
    setIsBulkLoading(true)
    try {
      const { action, userIds } = bulkActionDialog

      const updates: { role?: UserRole; deactivate?: boolean } = {}

      if (action === 'change_role') {
        updates.role = selectedRole
      } else if (action === 'deactivate') {
        updates.deactivate = true
      } else if (action === 'activate') {
        updates.deactivate = false
      }

      const result = await bulkUpdateUsers({
        userIds,
        updates,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully updated ${result.data?.count || userIds.length} user(s)`,
        })
        fetchUsers()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update users',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsBulkLoading(false)
      setBulkActionDialog({ open: false, action: '', userIds: [] })
    }
  }

  const handleExportCSV = () => {
    // Generate CSV from users
    const headers = ['Name', 'Email', 'Role', 'Department', 'Position', 'Status', 'Created']
    const rows = users.map((user) => [
      user.full_name,
      user.email,
      user.role,
      user.department || '',
      user.position || '',
      user.deactivated_at ? 'Deactivated' : 'Active',
      new Date(user.created_at).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Complete',
      description: `Exported ${users.length} users to CSV`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={users.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/admin/users/new')}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">All user accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => !u.deactivated_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => ['staff', 'admin', 'super_admin'].includes(u.role)).length}
            </div>
            <p className="text-xs text-muted-foreground">Support staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Unique departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find users by name, email, role, or department</CardDescription>
        </CardHeader>
        <CardContent>
          <UserFilters
            onFilterChange={handleFilterChange}
            departments={departments}
          />
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {total} user{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <UserTable
              users={users}
              total={total}
              page={page}
              perPage={perPage}
              currentUserRole={currentUserRole}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onBulkAction={handleBulkAction}
              onRefresh={fetchUsers}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialog.open}
        onOpenChange={(open) => {
          if (!open) setBulkActionDialog({ open: false, action: '', userIds: [] })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkActionDialog.action === 'change_role' && 'Change User Roles'}
              {bulkActionDialog.action === 'deactivate' && 'Deactivate Users'}
              {bulkActionDialog.action === 'activate' && 'Activate Users'}
            </DialogTitle>
            <DialogDescription>
              {bulkActionDialog.action === 'change_role' &&
                `Change the role for ${bulkActionDialog.userIds.length} selected user(s).`}
              {bulkActionDialog.action === 'deactivate' &&
                `Are you sure you want to deactivate ${bulkActionDialog.userIds.length} user(s)? They will no longer be able to access the system.`}
              {bulkActionDialog.action === 'activate' &&
                `Reactivate ${bulkActionDialog.userIds.length} user(s)? They will regain access to the system.`}
            </DialogDescription>
          </DialogHeader>

          {bulkActionDialog.action === 'change_role' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">New Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {currentUserRole === 'super_admin' && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog({ open: false, action: '', userIds: [] })}
              disabled={isBulkLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={executeBulkAction}
              disabled={isBulkLoading}
              variant={bulkActionDialog.action === 'deactivate' ? 'destructive' : 'default'}
            >
              {isBulkLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {bulkActionDialog.action === 'change_role' && (
                    <>
                      <UserCog className="mr-2 h-4 w-4" />
                      Change Roles
                    </>
                  )}
                  {bulkActionDialog.action === 'deactivate' && (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  )}
                  {bulkActionDialog.action === 'activate' && (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
