/**
 * User Filters Component
 *
 * Search and filter controls for the user list
 * Supports search by name/email, filter by role, department, and active status
 */

'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import type { UserRole } from '@/lib/types/database'

interface UserFiltersProps {
  onFilterChange: (filters: {
    search?: string
    role?: UserRole
    department?: string
    is_active?: boolean
  }) => void
  departments?: string[]
  className?: string
}

export function UserFilters({
  onFilterChange,
  departments = [],
  className,
}: UserFiltersProps) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [department, setDepartment] = useState<string>('all')
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'inactive'>('all')

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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, department..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            // Debounced search will be handled by parent
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleFilterChange()
            }
          }}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Role Filter */}
        <div className="space-y-2">
          <Label htmlFor="role-filter">Role</Label>
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as UserRole | 'all')
              handleFilterChange()
            }}
          >
            <SelectTrigger id="role-filter">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter */}
        <div className="space-y-2">
          <Label htmlFor="department-filter">Department</Label>
          <Select
            value={department}
            onValueChange={(value) => {
              setDepartment(value)
              handleFilterChange()
            }}
          >
            <SelectTrigger id="department-filter">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
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
        </div>

        {/* Active Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={activeStatus}
            onValueChange={(value) => {
              setActiveStatus(value as 'all' | 'active' | 'inactive')
              handleFilterChange()
            }}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Deactivated only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
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
            .filter(([_, value]) => value)
            .length}{' '}
          filter(s) applied
        </div>
      )}
    </div>
  )
}
