/**
 * Admin Audit Logs Page
 *
 * View and filter system audit logs for compliance and debugging
 * Accessible only to admin and super_admin roles
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Download, Search, RefreshCw, FileText, Filter } from 'lucide-react'
import {
  getAuditLogs,
  getAuditActionTypes,
  exportAuditLogs,
  type AuditLog,
  type AuditLogsFilters,
} from '@/app/actions/audit'
import { formatDistanceToNow } from 'date-fns'

export default function AuditLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [filters, setFilters] = useState<AuditLogsFilters>({
    action: searchParams.get('action') || undefined,
    search: searchParams.get('search') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    page: 1,
    limit: 50,
  })

  // Load action types
  useEffect(() => {
    loadActionTypes()
  }, [])

  // Load logs when filters change
  useEffect(() => {
    loadLogs()
  }, [filters, page])

  const loadActionTypes = async () => {
    const result = await getAuditActionTypes()
    if (result.success && result.data) {
      setActionTypes(result.data)
    }
  }

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const result = await getAuditLogs({ ...filters, page })

      if (result.success && result.data) {
        setLogs(result.data.data)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load audit logs',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadLogs()
  }

  const handleReset = () => {
    setFilters({
      page: 1,
      limit: 50,
    })
    setPage(1)
    router.push('/admin/audit')
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportAuditLogs(filters)

      if (result.success && result.data) {
        // Create download link
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'Success',
          description: 'Audit logs exported successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to export audit logs',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatActionType = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            View system activity and changes for compliance and debugging
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting || logs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter audit logs by action type, date range, or search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Action Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, action: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {formatActionType(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            {/* Search Filter */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} size="sm">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            {total} {total === 1 ? 'entry' : 'entries'} found
            {filters.action && ` • Filtered by: ${formatActionType(filters.action)}`}
            {filters.search && ` • Search: "${filters.search}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No audit logs found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Old Value</TableHead>
                      <TableHead>New Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          <div>{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                          <div className="text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.ticket_title}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {log.ticket_id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{log.user_name || 'System'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                            {formatActionType(log.action)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {log.old_value || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm font-medium">
                          {log.new_value || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
