/**
 * Status Badge Component
 *
 * Visual status indicator with colors for ticket statuses.
 * Maps ticket_status enum to display text and colors.
 */

import { Badge } from '@/components/ui/badge'
import { TICKET_STATUS_LABELS, type TicketStatus } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

/**
 * Get the appropriate color class for each ticket status
 */
function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800'
    case 'on_hold':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800'
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800'
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800'
  }
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
  const colorClass = getStatusColor(status)
  const icon = getStatusIcon(status)

  return (
    <Badge
      variant="outline"
      className={cn(colorClass, className)}
      aria-label={`Status: ${label}`}
    >
      <span className="mr-1" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Badge>
  )
}
