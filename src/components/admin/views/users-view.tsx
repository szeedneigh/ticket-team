'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, RefreshCw, Users, UserCheck, Briefcase, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getAllUsers, getDepartments } from '@/lib/users/queries'
import { bulkUpdateUsers } from '@/app/actions/users'
import { UserTable, UserFilters, UserForm } from '@/components/users'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'

export function UsersView() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [department, setDepartment] = useState('all')
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin'>('admin')
  
  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    staffMembers: 0,
    departmentCount: 0,
  })

  useEffect(() => {
    checkCurrentUser()
    fetchDepartments()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, role, department, activeStatus])

  const checkCurrentUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (data) {
        setCurrentUserRole(data.role as 'admin' | 'super_admin')
      }
    }
  }

  const fetchDepartments = async () => {
    try {
      const supabase = createClient()
      const result = await getDepartments(supabase)
      setDepartments(result)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { users: data, total: count } = await getAllUsers(
        supabase,
        {
          search,
          role: role === 'all' ? undefined : (role as string),
          department: department === 'all' ? undefined : department,
          is_active: activeStatus === 'all' ? undefined : activeStatus === 'active',
        },
        page,
        perPage
      )
      setUsers(data)
      setTotal(count)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createClient()
      
      // Get total users
      const { count: totalCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
      
      // Get active users
      const { count: activeCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .is('deactivated_at', null)
      
      // Get staff members
      const { count: staffCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('role', ['staff', 'admin', 'super_admin'])
        .is('deactivated_at', null)
      
      // Get unique departments
      const { data: deptData } = await supabase
        .from('users')
        .select('department')
        .not('department', 'is', null)
      
      const uniqueDepts = new Set(deptData?.map(d => d.department).filter(Boolean))
      
      setStats({
        totalUsers: totalCount || 0,
        activeUsers: activeCount || 0,
        staffMembers: staffCount || 0,
        departmentCount: uniqueDepts.size,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefresh = () => {
    fetchUsers()
    fetchStats()
    fetchDepartments()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleFilterChange = (filters: {
    search?: string
    role?: UserRole
    department?: string
    is_active?: boolean
  }) => {
    setSearch(filters.search || '')
    setRole(filters.role || 'all')
    setDepartment(filters.department || 'all')
    setActiveStatus(
      filters.is_active === undefined
        ? 'all'
        : filters.is_active
        ? 'active'
        : 'inactive'
    )
    setPage(1)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedUser(undefined)
    fetchUsers()
  }

  const handleExportCSV = () => {
    // Implementation for CSV export
    const headers = ['Name', 'Email', 'Role', 'Department', 'Position', 'Status', 'Joined']
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        `"${user.full_name}"`,
        user.email,
        user.role,
        user.department || '',
        user.position || '',
        user.deactivated_at ? 'Inactive' : 'Active',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'users_export.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleBulkAction = async (userIds: string[], action: string) => {
    try {
      if (action === 'delete') {
        // Implement bulk delete
        toast({
          title: 'Not Implemented',
          description: 'Bulk delete is not yet supported',
        })
        return
      }

      const result = await bulkUpdateUsers({
        userIds,
        updates: {
          deactivate: action !== 'activate'
        }
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully ${action}d ${userIds.length} users`,
        })
        fetchUsers()
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${action} users`,
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
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={users.length === 0 || isLoading}
            className="h-9"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedUser(undefined)
              setIsFormOpen(true)
            }}
            className="h-9 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All user accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staffMembers}</div>
            <p className="text-xs text-muted-foreground">Support staff</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departmentCount}</div>
            <p className="text-xs text-muted-foreground">Unique departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">All Users</h3>

        <div className="rounded-xl border border-primary/10 bg-card/50 backdrop-blur-xl shadow-sm">
          <div className="p-4 border-b border-primary/5">
             <UserFilters
              onFilterChange={handleFilterChange}
              departments={departments}
            />
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/50" />
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
          </div>
        </div>
      </div>

      {/* Create/Edit User Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? 'Update user details and permissions.'
                : 'Add a new user to the system. They will receive an email to set their password.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            mode={selectedUser ? 'edit' : 'create'}
            user={selectedUser}
            currentUserRole={currentUserRole}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
