/**
 * Time Filter Component
 *
 * Dropdown for filtering tickets by time period
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

interface TimeFilterProps {
  defaultValue?: TimePeriod
}

export function TimeFilter({ defaultValue = 'this_week' }: TimeFilterProps) {
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

    // Reset to page 1 when changing time filter
    params.delete('page')

    // Use current pathname to maintain route context
    router.push(`${pathname}?${params.toString()}`)
  }

  const currentPeriod = (searchParams.get('timePeriod') as TimePeriod) || defaultValue

  return (
    <Select value={currentPeriod} onValueChange={handleChange}>
      <SelectTrigger className="w-[150px]" aria-label="Filter tickets by time period">
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
