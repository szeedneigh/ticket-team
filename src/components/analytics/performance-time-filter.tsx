/**
 * Performance Time Filter Component
 *
 * Dropdown for filtering performance metrics by time period
 * Uses shadcn Select component
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIME_PERIOD } from '@/lib/constants'
import type { TimePeriod } from '@/lib/types/tickets'

export interface PerformanceTimeFilterProps {
  defaultValue?: TimePeriod
  basePath?: string
}

export function PerformanceTimeFilter({ defaultValue = 'this_month', basePath }: PerformanceTimeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const handleChange = (value: TimePeriod) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('timePeriod')
    } else {
      params.set('timePeriod', value)
    }

    // Use provided basePath, or derive from current pathname, or default to /performance
    const targetPath = basePath || pathname || '/performance'
    router.push(`${targetPath}?${params.toString()}`)
  }

  const currentPeriod = (searchParams.get('timePeriod') as TimePeriod) || defaultValue

  return (
    <Select value={currentPeriod} onValueChange={handleChange}>
      <SelectTrigger className="w-[150px] bg-background/50 border-white/20" aria-label="Filter performance by time period">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(TIME_PERIOD.LABELS) as [TimePeriod, string][]).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
