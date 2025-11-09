/**
 * Auto-Save Indicator Component
 *
 * Displays the current auto-save status with visual feedback.
 * Shows: idle, saving, saved, or error states.
 */

'use client'

import { Cloud, CloudOff, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SaveStatus } from '@/lib/hooks/use-auto-save'
import { formatDistanceToNow } from 'date-fns'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSaved: Date | null
  className?: string
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  className
}: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-muted-foreground',
          iconClassName: 'animate-spin'
        }
      case 'saved':
        return {
          icon: Check,
          text: lastSaved
            ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
            : 'Saved',
          className: 'text-green-600 dark:text-green-500',
          iconClassName: ''
        }
      case 'error':
        return {
          icon: CloudOff,
          text: 'Failed to save',
          className: 'text-destructive',
          iconClassName: ''
        }
      default:
        return {
          icon: Cloud,
          text: 'Draft',
          className: 'text-muted-foreground',
          iconClassName: ''
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs font-medium transition-colors',
        config.className,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <span>{config.text}</span>
    </div>
  )
}
