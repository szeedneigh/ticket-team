/**
 * Priority Badge Component
 *
 * Priority indicator with icons and color-coded badges.
 * Maps ticket_priority enum to display text and colors.
 */

import { Badge } from '@/components/ui/badge'
import { TICKET_PRIORITY_LABELS, type TicketPriority } from '@/lib/types/database'
import { getPriorityBadgeStyle } from '@/lib/constants/colors'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
  showIcon?: boolean
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
  const colorClass = getPriorityBadgeStyle(priority)
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
