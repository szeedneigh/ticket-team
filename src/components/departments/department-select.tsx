'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Department } from '@/lib/departments/actions'

export interface DepartmentSelectProps {
  departments: Department[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  /** Include a cleared / none option */
  allowEmpty?: boolean
  placeholder?: string
  id?: string
  'aria-invalid'?: boolean
  className?: string
}

/**
 * Dropdown of active departments from the `departments` table (by name, matching `users.department`).
 */
export function DepartmentSelect({
  departments,
  value,
  onValueChange,
  disabled,
  allowEmpty = true,
  placeholder = 'Select department',
  id,
  'aria-invalid': ariaInvalid,
  className,
}: DepartmentSelectProps) {
  const active = departments.filter((d) => d.is_active)
  const sorted = [...active].sort((a, b) => a.display_order - b.display_order)
  const sentinel = '__department_none__'
  const selectValue = value || sentinel

  return (
    <Select
      value={selectValue}
      onValueChange={(v) => onValueChange(v === sentinel ? '' : v)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-invalid={ariaInvalid}
        className={cn('w-full min-w-0', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && (
          <SelectItem value={sentinel}>
            <span className="text-muted-foreground">None</span>
          </SelectItem>
        )}
        {sorted.map((d) => (
          <SelectItem key={d.id} value={d.name}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
