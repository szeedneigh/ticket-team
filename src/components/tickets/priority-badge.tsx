/**
 * Priority Badge Component
 *
 * Priority indicator with icons and color-coded badges.
 * Maps ticket_priority enum to display text and colors.
 */

import { Badge } from '@/components/ui/badge'
import { TICKET_PRIORITY_LABELS, type TicketPriority } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
  showIcon?: boolean
}

/**
 * Get the appropriate color class for each priority
 */
function getPriorityColor(priority: TicketPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800'
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
    case 'critical':
      return 'bg-red-200 text-red-900 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800'
  }
}

/**
 * Get icon for priority
 */
function getPriorityIcon(priority: TicketPriority): string {
  switch (priority) {
    case 'low':
      return '↓'
    case 'medium':
      return '→'
    case 'high':
      return '↑'
    case 'urgent':
      return '⚠'
    case 'critical':
      return '🚨'
    default:
      return '→'
  }
}

/**
 * Get aria label for priority
 */
function getPriorityAriaLabel(priority: TicketPriority): string {
  const label = TICKET_PRIORITY_LABELS[priority]
  switch (priority) {
    case 'low':
      return `${label} priority - not urgent`
    case 'medium':
      return `${label} priority - normal urgency`
    case 'high':
      return `${label} priority - important`
    case 'urgent':
      return `${label} priority - immediate attention required`
    case 'critical':
      return `${label} priority - system-wide impact, requires immediate resolution`
    default:
      return `${label} priority`
  }
}

export function PriorityBadge({
  priority,
  className,
  showIcon = true,
}: PriorityBadgeProps) {
  const label = TICKET_PRIORITY_LABELS[priority]
  const colorClass = getPriorityColor(priority)
  const icon = getPriorityIcon(priority)
  const ariaLabel = getPriorityAriaLabel(priority)

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClass, 
        'transition-all duration-200 hover:scale-105 hover:shadow-sm',
        (priority === 'urgent' || priority === 'critical') && 'animate-pulse',
        className
      )}
      aria-label={ariaLabel}
    >
      {showIcon && (
        <span className="mr-1 font-bold" aria-hidden="true">
          {icon}
        </span>
      )}
      {label}
    </Badge>
  )
}
