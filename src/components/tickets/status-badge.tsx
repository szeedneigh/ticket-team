/**
 * Status Badge Component
 *
 * Visual status indicator with colors for ticket statuses.
 * Maps ticket_status enum to display text and colors.
 */

import { Badge } from '@/components/ui/badge'
import { TICKET_STATUS_LABELS, type TicketStatus } from '@/lib/types/database'
import { getStatusBadgeStyle } from '@/lib/constants/colors'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

/**
 * Get icon for status (optional enhancement)
 */
function getStatusIcon(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return '●'
    case 'in_progress':
      return '◐'
    case 'on_hold':
      return '⏸'
    case 'resolved':
      return '✓'
    case 'closed':
      return '○'
    case 'canceled':
      return '✕'
    default:
      return '●'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = TICKET_STATUS_LABELS[status]
  const colorClass = getStatusBadgeStyle(status)
  const icon = getStatusIcon(status)

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClass, 
        'transition-all duration-200 hover:scale-105 hover:shadow-sm',
        className
      )}
      aria-label={`Status: ${label}`}
    >
      <span className="mr-1" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Badge>
  )
}
