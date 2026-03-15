'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageCircle,
  Activity,
  User,
  Tag,
  FileText,
  CheckCircle,
  RotateCcw,
  Paperclip,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { TicketActivityWithUser, TicketCommentWithUser } from '@/lib/types/tickets'
import {
  ACTIVITY_TYPES,
  getActivityTypeLabel,
  formatActivityDetails,
  type ActivityType,
} from '@/lib/constants/activity-types'

/**
 * Ticket Timeline Component
 *
 * Displays a chronological view of all activities and comments on a ticket.
 * Features:
 * - Visual timeline with icons
 * - Differentiates comments vs system activities
 * - Shows "Internal Note" badge for staff-only comments
 * - Formatted timestamps
 * - User avatars and names
 * - Collapsed by default to latest 3 updates with "Show more" to expand
 */

const TIMELINE_INITIAL_VISIBLE = 3

interface TicketTimelineProps {
  activities: TicketActivityWithUser[]
  comments: TicketCommentWithUser[]
  isStaff?: boolean
}

type TimelineItem =
  | { type: 'activity'; data: TicketActivityWithUser }
  | { type: 'comment'; data: TicketCommentWithUser }

export function TicketTimeline({
  activities,
  comments,
  isStaff = false,
}: TicketTimelineProps) {
  const [expanded, setExpanded] = useState(false)

  // Combine and sort activities and comments by timestamp (newest first)
  const timelineItems: TimelineItem[] = [
    ...activities.map((activity) => ({ type: 'activity' as const, data: activity })),
    ...comments.map((comment) => ({ type: 'comment' as const, data: comment })),
  ].sort((a, b) => {
    const aTime = new Date(a.data.created_at).getTime()
    const bTime = new Date(b.data.created_at).getTime()
    return bTime - aTime // Newest first
  })

  const visibleItems = expanded
    ? timelineItems
    : timelineItems.slice(0, TIMELINE_INITIAL_VISIBLE)
  const hasMore = timelineItems.length > TIMELINE_INITIAL_VISIBLE
  const hiddenCount = timelineItems.length - TIMELINE_INITIAL_VISIBLE

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Activity className="mx-auto h-12 w-12 mb-2 opacity-20" />
          <p>No activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {visibleItems.map((item, index) => (
        <TimelineItemComponent
          key={`${item.type}-${item.data.id}`}
          item={item}
          isLast={index === visibleItems.length - 1}
          isStaff={isStaff}
        />
      ))}
      {hasMore && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {hiddenCount} more update{hiddenCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Timeline Item Component
// ============================================================================

interface TimelineItemComponentProps {
  item: TimelineItem
  isLast: boolean
  isStaff: boolean
}

function TimelineItemComponent({ item, isLast, isStaff }: TimelineItemComponentProps) {
  if (item.type === 'activity') {
    return <ActivityItem activity={item.data} isLast={isLast} />
  } else {
    return <CommentItem comment={item.data} isLast={isLast} isStaff={isStaff} />
  }
}

// ============================================================================
// Activity Item
// ============================================================================

interface ActivityItemProps {
  activity: TicketActivityWithUser
  isLast: boolean
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const icon = getActivityIcon(activity.action)
  const label = getActivityTypeLabel(activity.action as ActivityType)
  const details = activity.metadata
    ? formatActivityDetails(activity.action as ActivityType, activity.metadata as Record<string, unknown>)
    : ''

  return (
    <div className="flex gap-4 group">
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 border-2 border-background shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-border/30 mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between gap-4 rounded-lg p-2 -ml-2 group-hover:bg-muted/30 transition-colors duration-200">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{label}</p>
              {details && (
                <p className="text-sm text-muted-foreground">{details}</p>
              )}
            </div>
            {activity.user && (
              <p className="text-xs text-muted-foreground">
                by {activity.user.full_name}
              </p>
            )}
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap px-2 py-1 rounded-full bg-muted/50">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </time>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Comment Item
// ============================================================================

interface CommentItemProps {
  comment: TicketCommentWithUser
  isLast: boolean
  isStaff: boolean
}

function CommentItem({ comment, isLast }: CommentItemProps) {
  const isInternal = comment.is_internal

  return (
    <div className="flex gap-4 group">
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-[#1f3463] to-[#2cafdd] text-white text-xs font-medium">
            {comment.user?.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-border/30 mt-2" />}
      </div>

      {/* Content */}
      <Card className={`flex-1 mb-4 transition-all duration-200 hover:shadow-lg ${
        isInternal 
          ? 'border-amber-500/50 bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20' 
          : 'bg-background/60 backdrop-blur-sm hover:bg-background/80'
      }`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{comment.user?.full_name || 'Unknown User'}</p>
              {isInternal && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Internal Note
                </Badge>
              )}
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap px-2 py-1 rounded-full bg-muted/50">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </time>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>

          {/* Comment Attachments */}
          {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Paperclip className="h-3 w-3 text-[#2cafdd]" />
                {comment.attachments.length} attachment{comment.attachments.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

function getActivityIcon(action: string) {
  const className = "h-5 w-5 text-muted-foreground"

  switch (action) {
    case ACTIVITY_TYPES.TICKET_CREATED:
      return <FileText className={className} />
    case ACTIVITY_TYPES.STATUS_CHANGED:
      return <Activity className={className} />
    case ACTIVITY_TYPES.TICKET_ASSIGNED:
    case ACTIVITY_TYPES.ASSIGNMENT_CHANGED:
      return <User className={className} />
    case ACTIVITY_TYPES.PRIORITY_CHANGED:
      return <Tag className={className} />
    case ACTIVITY_TYPES.COMMENT_ADDED:
    case ACTIVITY_TYPES.INTERNAL_NOTE_ADDED:
      return <MessageCircle className={className} />
    case ACTIVITY_TYPES.ATTACHMENT_ADDED:
      return <Paperclip className={className} />
    case ACTIVITY_TYPES.RESOLUTION_ADDED:
      return <CheckCircle className={className} />
    case ACTIVITY_TYPES.TICKET_REOPENED:
      return <RotateCcw className={className} />
    default:
      return <Activity className={className} />
  }
}
