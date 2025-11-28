/**
 * User Table Component
 *
 * Displays users in a sortable, paginated table
 * Supports row selection for bulk actions
 */

'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from './user-avatar'
import { RoleBadge } from './role-badge'
import { UserActionsMenu } from './user-actions-menu'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'

interface UserTableProps {
  users: User[]
  total: number
  page: number
  perPage: number
  currentUserRole: 'admin' | 'super_admin'
  onPageChange: (page: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onEdit?: (user: User) => void
  onChangeRole?: (user: User) => void
  onBulkAction?: (userIds: string[], action: string) => void
  onRefresh?: () => void
}

type SortColumn = 'full_name' | 'email' | 'role' | 'department' | 'created_at'
type SortDirection = 'asc' | 'desc'

export const UserTable = memo(function UserTable({
  users,
  total,
  page,
  perPage,
  currentUserRole,
  onPageChange,
  onSort,
  onEdit,
  onChangeRole,
  onBulkAction,
  onRefresh,
}: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Memoize pagination calculations
  const paginationInfo = useMemo(() => ({
    totalPages: Math.ceil(total / perPage),
    hasNextPage: page < Math.ceil(total / perPage),
    hasPrevPage: page > 1,
  }), [total, perPage, page])

  // Handle select all - useCallback for stable reference
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map((u) => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }, [users])

  // Handle individual row selection - useCallback for stable reference
  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers((prev) => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(userId)
      } else {
        newSelected.delete(userId)
      }
      return newSelected
    })
  }, [])

  // Handle sorting - useCallback for stable reference
  const handleSort = useCallback((column: SortColumn) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort?.(column, newDirection)
  }, [sortColumn, sortDirection, onSort])

  // Check if all visible users are selected - memoize expensive computation
  const selectionState = useMemo(() => ({
    allSelected: users.length > 0 && users.every((u) => selectedUsers.has(u.id)),
    someSelected: users.some((u) => selectedUsers.has(u.id)) && !(users.length > 0 && users.every((u) => selectedUsers.has(u.id))),
  }), [users, selectedUsers])

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted p-4">
          <span className="text-sm font-medium">
            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            {currentUserRole === 'super_admin' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.(Array.from(selectedUsers), 'change_role')}
              >
                Change Role
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction?.(Array.from(selectedUsers), 'activate')}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction?.(Array.from(selectedUsers), 'deactivate')}
            >
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedUsers(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectionState.allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all users"
                  className={selectionState.someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('full_name')}
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('email')}
                >
                  Email
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('role')}
                >
                  Role
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('department')}
                >
                  Department
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('created_at')}
                >
                  Joined
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p>No users found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.deactivated_at ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) =>
                        handleSelectUser(user.id, checked as boolean)
                      }
                      aria-label={`Select ${user.full_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <UserAvatar
                      user={user}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{user.full_name}</span>
                      {user.position && (
                        <span className="text-xs text-muted-foreground">{user.position}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role as UserRole} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.department || (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.deactivated_at ? (
                      <Badge
                        variant="destructive"
                        className="bg-red-50 text-red-700"
                      >
                        Deactivated
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <UserActionsMenu
                      user={user}
                      currentUserRole={currentUserRole}
                      onEdit={onEdit}
                      onChangeRole={onChangeRole}
                      onActionComplete={onRefresh}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}{' '}
            users
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!paginationInfo.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                let pageNum: number
                if (paginationInfo.totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= paginationInfo.totalPages - 2) {
                  pageNum = paginationInfo.totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="h-8 w-8"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!paginationInfo.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})
