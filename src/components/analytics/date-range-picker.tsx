/**
 * Date Range Picker Component
 *
 * Allows users to select a date range for filtering analytics data.
 * Uses native HTML date inputs for simplicity.
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/lib/types/analytics'

export interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Select date range',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState(
    value?.start ? format(value.start, 'yyyy-MM-dd') : ''
  )
  const [endDate, setEndDate] = useState(
    value?.end ? format(value.end, 'yyyy-MM-dd') : ''
  )

  const handleApply = () => {
    if (startDate && endDate) {
      onChange({
        start: new Date(startDate),
        end: new Date(endDate),
      })
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onChange(undefined)
    setIsOpen(false)
  }

  const handleQuickSelect = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
    onChange({ start, end })
    setIsOpen(false)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.start ? (
              value.end ? (
                <>
                  {format(value.start, 'LLL dd, y')} - {format(value.end, 'LLL dd, y')}
                </>
              ) : (
                format(value.start, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(7)}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(30)}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(90)}
                >
                  Last 90 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const end = new Date()
                    const start = new Date(end.getFullYear(), 0, 1)
                    setStartDate(format(start, 'yyyy-MM-dd'))
                    setEndDate(format(end, 'yyyy-MM-dd'))
                    onChange({ start, end })
                    setIsOpen(false)
                  }}
                >
                  This year
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Custom Range</h4>
              <div className="grid gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <XIcon className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!startDate || !endDate}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
