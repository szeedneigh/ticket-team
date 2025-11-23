/**
 * Audit Log Filters Component
 *
 * Filter sidebar for audit log viewer with date range, user, and activity type filters
 */

'use client'

import { useState } from 'react'
import { Calendar, User, Filter, X } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditLogFilters, ActivityType } from '@/lib/types/audit'
import { ACTIVITY_TYPE_LABELS } from '@/lib/types/audit'

interface AuditFiltersProps {
  filters: AuditLogFilters
  users: { id: string; full_name: string; email: string }[]
  onFilterChange: (filters: AuditLogFilters) => void
  onClearFilters: () => void
}

export function AuditFilters({ filters, users, onFilterChange, onClearFilters }: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>(filters)

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClear = () => {
    setLocalFilters({})
    onClearFilters()
  }

  const hasActiveFilters = Object.keys(localFilters).some(
    (key) => localFilters[key as keyof AuditLogFilters] !== undefined
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="mr-2 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Date Range
          </Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="startDate"
                type="date"
                value={localFilters.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value ? `${e.target.value}T00:00:00Z` : undefined)
                }
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="endDate"
                type="date"
                value={localFilters.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  handleFilterChange('endDate', e.target.value ? `${e.target.value}T23:59:59Z` : undefined)
                }
              />
            </div>
          </div>
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-3 w-3" />
            User
          </Label>
          <Select
            value={localFilters.userId || 'all'}
            onValueChange={(value) => handleFilterChange('userId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Activity Type</Label>
          <Select
            value={(localFilters.activityType as string) || 'all'}
            onValueChange={(value) =>
              handleFilterChange('activityType', value === 'all' ? undefined : (value as ActivityType))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ticket ID Search */}
        <div className="space-y-2">
          <Label htmlFor="ticketId" className="text-sm font-medium">
            Ticket ID
          </Label>
          <Input
            id="ticketId"
            placeholder="e.g., TKT-12345"
            value={localFilters.ticketId || ''}
            onChange={(e) => handleFilterChange('ticketId', e.target.value || undefined)}
          />
        </div>

        {/* Search in Content */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search in values, comments..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          />
          <p className="text-xs text-muted-foreground">
            Searches in field names, old values, new values, and comments
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

