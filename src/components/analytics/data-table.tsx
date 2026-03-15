/**
 * Analytics Data Table Component
 *
 * Premium tabular display with glassmorphism styling,
 * sorting, pagination, and hover effects.
 */

'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, TableIcon } from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
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
      return <ArrowUpDownIcon className="ml-1.5 h-3.5 w-3.5 opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="ml-1.5 h-3.5 w-3.5 text-[#0693D2]" />
    ) : (
      <ArrowDownIcon className="ml-1.5 h-3.5 w-3.5 text-[#0693D2]" />
    )
  }, [sortKey, sortDirection])

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border border-white/30 dark:border-white/10',
      'bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg',
      className
    )}>
      {/* Header */}
      <div className="border-b border-white/20 p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      
      {/* Content */}
      <div className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          'bg-slate-50/50 dark:bg-slate-900/30 font-semibold text-foreground',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.sortable ? (
                          <Button
                            variant="ghost"
                            onClick={() => handleSort(column.key)}
                            className="-ml-3 h-auto p-2 font-semibold hover:bg-white/50 dark:hover:bg-white/10 rounded-lg"
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
                      <TableCell colSpan={columns.length} className="h-32">
                        <Empty className="border-0 p-4">
                          <EmptyHeader>
                            <EmptyMedia variant="icon"><TableIcon className="size-5" /></EmptyMedia>
                            <EmptyTitle className="text-sm font-normal text-muted-foreground">{emptyMessage}</EmptyTitle>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginationInfo.paginatedData.map((row, rowIndex) => (
                      <TableRow 
                        key={rowIndex}
                        className="border-white/10 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                      >
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{paginationInfo.startIndex + 1}</span> to{' '}
                  <span className="font-medium text-foreground">{Math.min(paginationInfo.endIndex, sortedData.length)}</span> of{' '}
                  <span className="font-medium text-foreground">{sortedData.length}</span> results
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, paginationInfo.totalPages) }).map((_, i) => {
                      let pageNum: number
                      if (paginationInfo.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= paginationInfo.totalPages - 2) {
                        pageNum = paginationInfo.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'h-8 w-8 p-0',
                            currentPage === pageNum 
                              ? 'bg-[#0693D2] hover:bg-[#0570A6] text-white'
                              : 'hover:bg-white/50 dark:hover:bg-white/10'
                          )}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
                    disabled={currentPage === paginationInfo.totalPages}
                    className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})
