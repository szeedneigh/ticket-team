'use client'

import { useEffect, useState } from 'react'
import { Download, RefreshCw, TrendingUp, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { AuditLogTable } from '@/components/audit/audit-log-table'
import { AuditFilters } from '@/components/audit/audit-filters'
import {
  getAuditLogs,
  getAuditLogStats,
  exportAuditLogsCSV,
} from '@/lib/audit/queries'
import type {
  AuditLogEntry,
  AuditLogPagination,
  AuditLogFilters,
  AuditLogStats,
  AuditLogSort,
  AuditLogSortField,
} from '@/lib/types/audit'

export function AuditLogView() {
  const { toast } = useToast()

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState<AuditLogPagination>({
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState<AuditLogFilters>({})
  const [sort, setSort] = useState<AuditLogSort>({
    field: 'performed_at',
    order: 'desc',
  })
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin' | null>(null)

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()

      if (!data || !['admin', 'super_admin'].includes(data.role)) {
        return
      }

      setCurrentUserRole(data.role as 'admin' | 'super_admin')
    }

    checkAuth()
  }, [])

  // Fetch users for filter
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .order('full_name')

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    if (currentUserRole) {
      fetchUsers()
    }
  }, [currentUserRole])

  // Fetch audit logs
  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const result = await getAuditLogs(supabase, filters, pagination.page, pagination.perPage, sort)

      setLogs(result.logs)
      setPagination(result.pagination)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error fetching audit logs:', errorMessage, error)
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const supabase = createClient()
      const statsData = await getAuditLogStats(supabase, filters)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch logs when filters, page, or sort change
  useEffect(() => {
    if (currentUserRole) {
      fetchLogs()
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, sort, currentUserRole])

  const handleFilterChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleClearFilters = () => {
    setFilters({})
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSort = (field: AuditLogSortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const csvData = await exportAuditLogsCSV(supabase, filters)

      if (csvData.length === 0) {
        toast({
          title: 'No Data',
          description: 'No audit logs to export with current filters',
        })
        return
      }

      // Convert to CSV string
      const headers = Object.keys(csvData[0])
      const csvRows = [
        headers.join(','),
        ...csvData.map((row) =>
          headers.map((header) => {
            const value = row[header as keyof typeof row]
            // Escape quotes and wrap in quotes if contains comma or quote
            const stringValue = String(value || '')
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          }).join(',')
        ),
      ].join('\n')

      // Download file
      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Complete',
        description: `Exported ${csvData.length} audit log entries`,
      })
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-muted-foreground">
            Complete history of ticket activities and changes
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || logs.length === 0}
          >
            {isExporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActivities.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All recorded activities</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Users who performed activities</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.earliestActivity && stats.latestActivity ? (
                <>
                  <div className="text-sm font-medium">
                    {new Date(stats.earliestActivity).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    to {new Date(stats.latestActivity).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No activities</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Top Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.activityBreakdown[0] ? (
                <>
                  <div className="text-sm font-medium">
                    {stats.activityBreakdown[0].type.replace(/_/g, ' ')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activityBreakdown[0].count} times
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No activities</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Filters Sidebar */}
        <div>
          <AuditFilters
            filters={filters}
            users={users}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Main Content */}
        <div>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {pagination.total.toLocaleString()} {pagination.total === 1 ? 'entry' : 'entries'} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </div>
              ) : (
                <AuditLogTable
                  logs={logs}
                  pagination={pagination}
                  sortField={sort.field}
                  sortOrder={sort.order}
                  onSort={handleSort}
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
