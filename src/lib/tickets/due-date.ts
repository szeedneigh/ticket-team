/**
 * Due date display helpers (SLA deadline)
 */

import type { TicketStatus } from '@/lib/types/database'

export type DueDateUrgency = 'hidden' | 'ok' | 'soon' | 'overdue'

const TERMINAL: TicketStatus[] = ['resolved', 'closed', 'canceled']

/**
 * Visual urgency for ticket due date (active tickets only).
 */
export function getDueDateUrgency(
  dueDateIso: string | null | undefined,
  status: TicketStatus
): DueDateUrgency {
  if (!dueDateIso || TERMINAL.includes(status)) return 'hidden'
  const due = new Date(dueDateIso).getTime()
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (due < now) return 'overdue'
  if (due - now <= dayMs) return 'soon'
  return 'ok'
}

export function dueDateUrgencyClass(urgency: DueDateUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'text-destructive font-semibold'
    case 'soon':
      return 'text-amber-600 dark:text-amber-400 font-medium'
    case 'ok':
      return 'text-emerald-700 dark:text-emerald-400'
    default:
      return 'text-muted-foreground'
  }
}
