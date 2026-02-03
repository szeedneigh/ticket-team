'use client'

import { useState, useEffect } from 'react'
import { Download, RefreshCw, Users, UserCheck, Briefcase, Building2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
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
import { UsersViewSkeleton } from '@/components/admin/users-view-skeleton'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'

export function UsersView() {
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
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
      setIsInitialLoad(false)
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

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage)
    setPage(1) // Reset to first page when changing per page
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

  // Show skeleton on initial load
  if (isInitialLoad) {
    return <UsersViewSkeleton />
  }

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15
      }
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header Content */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                User Management
              </h1>
              <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 max-w-2xl">
                Manage user accounts, roles, and permissions.
                <Sparkles className="h-4 w-4 text-[#2cafdd]" />
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={users.length === 0 || isLoading}
                className="h-10 bg-background/50 backdrop-blur-sm border-primary/10 hover:bg-background/80"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-10 bg-background/50 backdrop-blur-sm border-primary/10 hover:bg-background/80"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Controls Section */}
          <motion.div variants={itemVariants} className="flex flex-col gap-6 bg-background/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-[#1f3463]/5">
            <UserFilters
              onFilterChange={handleFilterChange}
              departments={departments}
              perPage={perPage}
              onPerPageChange={handlePerPageChange}
            />
          </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8"
      >
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg shadow-[#1f3463]/5 hover:shadow-xl hover:shadow-[#1f3463]/10 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Users</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">All user accounts in system</p>
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg shadow-[#1f3463]/5 hover:shadow-xl hover:shadow-[#1f3463]/10 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Active Users</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                <UserCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently active accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg shadow-[#1f3463]/5 hover:shadow-xl hover:shadow-[#1f3463]/10 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Staff Members</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                <Briefcase className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.staffMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">Support staff and admins</p>
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg shadow-[#1f3463]/5 hover:shadow-xl hover:shadow-[#1f3463]/10 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Departments</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.departmentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique departments</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Table Section */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-lg shadow-[#1f3463]/5 overflow-hidden">
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
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Edit User Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            mode="edit"
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
