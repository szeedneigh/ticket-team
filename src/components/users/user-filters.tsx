/**
 * User Filters Component
 *
 * Search and filter controls for the user list
 * Supports search by name/email, filter by role, department, and active status
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/lib/types/database'
import { SEARCH } from '@/lib/constants'

const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

interface UserFiltersProps {
  onFilterChange: (filters: {
    search?: string
    role?: UserRole
    department?: string
    is_active?: boolean
  }) => void
  departments?: string[]
  perPage?: number
  onPerPageChange?: (perPage: number) => void
  className?: string
}

export function UserFilters({
  onFilterChange,
  departments = [],
  perPage = 10,
  onPerPageChange,
  className,
}: UserFiltersProps) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [department, setDepartment] = useState<string>('all')
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange()
    }, SEARCH.DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, department, activeStatus])

  const handleFilterChange = () => {
    onFilterChange({
      search: search || undefined,
      role: role !== 'all' ? role : undefined,
      department: department !== 'all' ? department : undefined,
      is_active:
        activeStatus === 'all' ? undefined : activeStatus === 'active' ? true : false,
    })
  }

  const handleReset = () => {
    setSearch('')
    setRole('all')
    setDepartment('all')
    setActiveStatus('all')
    onFilterChange({})
  }

  const hasActiveFilters =
    search || role !== 'all' || department !== 'all' || activeStatus !== 'all'

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              // Debounced search is handled by useEffect
            }}
            className="pl-10 h-10 bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20 w-full"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as UserRole | 'all')
              handleFilterChange()
            }}
          >
            <SelectTrigger id="role-filter" className="w-[140px] h-10 bg-background/50 backdrop-blur-sm border-primary/10">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Filter */}
          <Select
            value={department}
            onValueChange={(value) => {
              setDepartment(value)
              handleFilterChange()
            }}
          >
            <SelectTrigger id="department-filter" className="w-[160px] h-10 bg-background/50 backdrop-blur-sm border-primary/10">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem
                  key={dept}
                  value={dept}
                >
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active Status Filter */}
          <Select
            value={activeStatus}
            onValueChange={(value) => {
              setActiveStatus(value as 'all' | 'active' | 'inactive')
              handleFilterChange()
            }}
          >
            <SelectTrigger id="status-filter" className="w-[140px] h-10 bg-background/50 backdrop-blur-sm border-primary/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Per Page Filter */}
          {onPerPageChange && (
            <Select
              value={perPage.toString()}
              onValueChange={(value) => onPerPageChange(Number.parseInt(value, 10))}
            >
              <SelectTrigger id="per-page-filter" className="min-w-[150px] w-[150px] h-10 bg-background/50 backdrop-blur-sm border-primary/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Reset Filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          {Object.entries({
            search,
            role: role !== 'all' ? role : null,
            department: department !== 'all' ? department : null,
            status: activeStatus !== 'all' ? activeStatus : null,
          })
            .filter(([_key, value]) => value)
            .length}{' '}
          filter(s) applied
        </div>
      )}
    </div>
  )
}
