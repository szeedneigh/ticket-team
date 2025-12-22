/**
 * Performance Time Filter Component
 *
 * Dropdown for filtering performance metrics by time period
 * Uses shadcn Select component
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIME_PERIOD } from '@/lib/constants'
import type { TimePeriod } from '@/lib/types/tickets'

interface PerformanceTimeFilterProps {
  defaultValue?: TimePeriod
}

export function PerformanceTimeFilter({ defaultValue = 'this_month' }: PerformanceTimeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: TimePeriod) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('timePeriod')
    } else {
      params.set('timePeriod', value)
    }

    router.push(`/performance?${params.toString()}`)
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
