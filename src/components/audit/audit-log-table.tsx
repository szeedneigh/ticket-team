/**
 * Audit Log Table Component
 *
 * Displays audit log entries in a table with sorting and pagination
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, FileText, User } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { AuditLogEntry, AuditLogPagination, AuditLogSortField, AuditLogSortOrder } from '@/lib/types/audit'
import { getActivityTypeLabel, isMajorActivity } from '@/lib/types/audit'
import { formatDistanceToNow } from 'date-fns'

interface AuditLogTableProps {
  logs: AuditLogEntry[]
  pagination: AuditLogPagination
  sortField: AuditLogSortField
  sortOrder: AuditLogSortOrder
  onSort: (field: AuditLogSortField) => void
  onPageChange: (page: number) => void
}

export function AuditLogTable({
  logs,
  pagination,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
}: AuditLogTableProps) {
  const renderSortIcon = (field: AuditLogSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-3 w-3" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3" />
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    }
  }

  const renderValue = (value: string | null) => {
    if (!value || value === 'null') return <span className="text-muted-foreground">—</span>
    if (value.length > 50) {
      return (
        <span className="text-xs" title={value}>
          {value.substring(0, 50)}...
        </span>
      )
    }
    return <span className="text-xs">{value}</span>
  }

  // Generate page numbers
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const { page, totalPages } = pagination

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (page > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No audit logs found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or date range
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => onSort('performed_at')}
                >
                  Date & Time
                  {renderSortIcon('performed_at')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => onSort('performed_by')}
                >
                  User
                  {renderSortIcon('performed_by')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => onSort('ticket_id')}
                >
                  Ticket
                  {renderSortIcon('ticket_id')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => onSort('activity_type')}
                >
                  Action
                  {renderSortIcon('activity_type')}
                </Button>
              </TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Old Value</TableHead>
              <TableHead>New Value</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const dateInfo = formatDate(log.performed_at)
              const isMajor = isMajorActivity(log.activity_type)

              return (
                <TableRow key={log.id} className={isMajor ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{dateInfo.date}</span>
                      <span className="text-xs text-muted-foreground">{dateInfo.time}</span>
                      <span className="text-xs text-muted-foreground">{dateInfo.relative}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {log.user?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.user?.email || ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.ticket ? (
                      <Link
                        href={`/tickets/${log.ticket_id}`}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        {log.ticket.ticket_number}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isMajor ? 'default' : 'secondary'} className="text-xs">
                      {getActivityTypeLabel(log.activity_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderValue(log.field_name)}</TableCell>
                  <TableCell>{renderValue(log.old_value)}</TableCell>
                  <TableCell>{renderValue(log.new_value)}</TableCell>
                  <TableCell>{renderValue(log.comment)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {generatePageNumbers().map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {pageNum === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={pageNum === pagination.page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  className={
                    pagination.page === pagination.totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

