/**
 * Status Cell Component
 *
 * Displays ticket status with colored dot and label
 * Used in ticket table for status column
 */

import type { TicketStatus } from '@/lib/types/database'
import { TICKET_STATUS_LABELS } from '@/lib/types/database'
import { STATUS_DOT_COLORS } from '@/lib/constants/colors'
import { cn } from '@/lib/utils'

interface StatusCellProps {
  status: TicketStatus
  className?: string
}

export function StatusCell({ status, className }: StatusCellProps) {
  const colors = STATUS_DOT_COLORS[status]
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
