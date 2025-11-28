/**
 * Analytics Data Table Component
 *
 * Tabular display for detailed analytics data with sorting and pagination.
 */

'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableColumn {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

export interface DataTableProps {
  title: string
  description?: string
  columns: DataTableColumn[]
  data: Array<Record<string, unknown>>
  className?: string
  loading?: boolean
  emptyMessage?: string
  pageSize?: number
  showPagination?: boolean
}

type SortDirection = 'asc' | 'desc' | null

export const DataTable = memo(function DataTable({
  title,
  description,
  columns,
  data,
  className,
  loading = false,
  emptyMessage = 'No data available',
  pageSize = 10,
  showPagination = true,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Handle sorting - useCallback for stable reference
  const handleSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        // Cycle through: asc -> desc -> null
        setSortDirection((prevDir) => {
          if (prevDir === 'asc') return 'desc'
          if (prevDir === 'desc') {
            setSortKey(null)
            return null
          }
          return 'asc'
        })
        return prevKey
      } else {
        setSortDirection('asc')
        setCurrentPage(1) // Reset to first page on sort
        return key
      }
    })
  }, [])

  // Sort data - memoize expensive sort operation
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue === bValue) return 0

      // Cast to string for comparison (handles strings, numbers converted to strings)
      const aStr = String(aValue ?? '')
      const bStr = String(bValue ?? '')
      const comparison = aStr > bStr ? 1 : -1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  // Paginate data - memoize pagination calculation
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(sortedData.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = showPagination
      ? sortedData.slice(startIndex, endIndex)
      : sortedData

    return { totalPages, startIndex, endIndex, paginatedData }
  }, [sortedData, currentPage, pageSize, showPagination])

  // Render sort icon - useCallback for stable reference
  const renderSortIcon = useCallback((columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDownIcon className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDownIcon className="ml-2 h-4 w-4" />
    )
  }, [sortKey, sortDirection])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.sortable ? (
                          <Button
                            variant="ghost"
                            onClick={() => handleSort(column.key)}
                            className="-ml-4 h-auto p-2 font-medium hover:bg-transparent"
                          >
                            {column.label}
                            {renderSortIcon(column.key)}
                          </Button>
                        ) : (
                          column.label
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginationInfo.paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginationInfo.paginatedData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={cn(
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right'
                            )}
                          >
                            {column.render
                              ? column.render(row[column.key], row)
                              : (row[column.key] as React.ReactNode)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {showPagination && paginationInfo.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {paginationInfo.startIndex + 1} to {Math.min(paginationInfo.endIndex, sortedData.length)} of{' '}
                  {sortedData.length} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {paginationInfo.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
                    disabled={currentPage === paginationInfo.totalPages}
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
  )
})
