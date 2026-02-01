'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, RefreshCw, TrendingUp, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { AuditLogTable } from '@/components/audit/audit-log-table'
import { AuditFilters } from '@/components/audit/audit-filters'
import { exportAuditLogsCSV } from '@/lib/audit/queries'
import { getAuditLogPageData } from '@/app/actions/audit'
import type {
  AuditLogEntry,
  AuditLogPagination,
  AuditLogFilters,
  AuditLogStats,
  AuditLogSort,
  AuditLogSortField,
} from '@/lib/types/audit'

type AuditPageData = {
  logs: AuditLogEntry[]
  pagination: AuditLogPagination
  stats: AuditLogStats
  users: { id: string; full_name: string; email: string }[]
}

function isAuditPageData(x: unknown): x is AuditPageData {
  return (
    typeof x === 'object' &&
    x !== null &&
    'logs' in x &&
    Array.isArray((x as AuditPageData).logs)
  )
}

export function AuditLogView({ initialData }: { initialData?: unknown }) {
  const { toast } = useToast()

  const data = isAuditPageData(initialData) ? initialData : null
  const [logs, setLogs] = useState<AuditLogEntry[]>(data?.logs ?? [])
  const [pagination, setPagination] = useState<AuditLogPagination>(
    data?.pagination ?? { page: 1, perPage: 50, total: 0, totalPages: 0 }
  )
  const [filters, setFilters] = useState<AuditLogFilters>({})
  const [sort, setSort] = useState<AuditLogSort>({
    field: 'performed_at',
    order: 'desc',
  })
  const [stats, setStats] = useState<AuditLogStats | null>(data?.stats ?? null)
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>(
    data?.users ?? []
  )
  const [isLoading, setIsLoading] = useState(!data)
  const [isExporting, setIsExporting] = useState(false)

  // Single parallel fetch: logs, stats, users (layout already guards admin access)
  const fetchPageData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAuditLogPageData(
        filters,
        pagination.page,
        pagination.perPage,
        sort
      )

      if (!result.success || !result.data) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load audit logs',
          variant: 'destructive',
        })
        return
      }

      setLogs(result.data.logs)
      setPagination(result.data.pagination)
      setStats(result.data.stats)
      setUsers(result.data.users)
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
  }, [filters, pagination.page, pagination.perPage, sort, toast])

  useEffect(() => {
    fetchPageData()
  }, [fetchPageData])

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
            onClick={fetchPageData}
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
