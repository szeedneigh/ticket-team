/**
 * Status Cell Component
 *
 * Displays ticket status with colored dot and label
 * Used in ticket table for status column
 */

import type { TicketStatus } from '@/lib/types/database'
import { TICKET_STATUS_LABELS } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface StatusCellProps {
  status: TicketStatus
  className?: string
}

// Status color mapping
const STATUS_COLORS: Record<TicketStatus, { dot: string; text: string }> = {
  open: {
    dot: 'bg-gray-400',
    text: 'text-gray-700 dark:text-gray-300',
  },
  in_progress: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  on_hold: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  resolved: {
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  closed: {
    dot: 'bg-gray-600',
    text: 'text-gray-700 dark:text-gray-400',
  },
  canceled: {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
}

export function StatusCell({ status, className }: StatusCellProps) {
  const colors = STATUS_COLORS[status]
  const label = TICKET_STATUS_LABELS[status]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn('h-2 w-2 rounded-full', colors.dot)}
        aria-hidden="true"
      />
      <span className={cn('text-sm font-medium', colors.text)}>{label}</span>
    </div>
  )
}
