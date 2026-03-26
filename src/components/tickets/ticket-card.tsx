/**
 * Ticket Card Component
 *
 * Displays ticket summary with title, status, priority, created date, and assignment info.
 * Links to ticket detail page. Color-coded by status/priority.
 */

'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { PriorityBadge } from './priority-badge'
import type { TicketWithUser } from '@/lib/types/tickets'
import { cn } from '@/lib/utils'
import { getDueDateUrgency } from '@/lib/tickets/due-date'

interface TicketCardProps {
  ticket: TicketWithUser
  className?: string
}

/**
 * Format date to relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`
  }

  // Format as date if older than 4 weeks
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Truncate description to specified length
 */
function truncateDescription(description: string, maxLength: number = 150): string {
  if (description.length <= maxLength) {
    return description
  }
  return description.substring(0, maxLength).trim() + '...'
}

export function TicketCard({ ticket, className }: TicketCardProps) {
  const dueUrgency = getDueDateUrgency(ticket.due_date, ticket.status)
  const showOverdue =
    dueUrgency === 'overdue' &&
    ['open', 'in_progress', 'on_hold'].includes(ticket.status)

  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <Card
        className={cn(
          'transition-all hover:shadow-md hover:border-primary/50',
          'cursor-pointer',
          className
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="line-clamp-2 text-base">
              {ticket.title}
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {showOverdue && (
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive border border-destructive/30">
                  Overdue
                </span>
              )}
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {truncateDescription(ticket.description)}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">Category:</span> {ticket.category}
              </span>
              {ticket.subcategory && (
                <span className="text-muted-foreground/70">
                  / {ticket.subcategory}
                </span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Created by{' '}
              <span className="font-medium text-foreground">
                {ticket.user.full_name}
              </span>
            </span>
            <span>•</span>
            <time dateTime={ticket.created_at}>
              {formatRelativeTime(ticket.created_at)}
            </time>
          </div>

          {ticket.assigned_user && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Assigned to:</span>
              <span className="font-medium text-foreground">
                {ticket.assigned_user.full_name}
              </span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
