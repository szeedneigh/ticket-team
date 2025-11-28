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
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
 */

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
  // Combine and sort activities and comments by timestamp
  const timelineItems: TimelineItem[] = [
    ...activities.map((activity) => ({ type: 'activity' as const, data: activity })),
    ...comments.map((comment) => ({ type: 'comment' as const, data: comment })),
  ].sort((a, b) => {
    const aTime = new Date(a.data.created_at).getTime()
    const bTime = new Date(b.data.created_at).getTime()
    return bTime - aTime // Newest first
  })

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
      {timelineItems.map((item, index) => (
        <TimelineItemComponent
          key={`${item.type}-${item.data.id}`}
          item={item}
          isLast={index === timelineItems.length - 1}
          isStaff={isStaff}
        />
      ))}
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
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border-2 border-background">
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
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
          <time className="text-xs text-muted-foreground whitespace-nowrap">
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

function CommentItem({ comment, isLast, isStaff }: CommentItemProps) {
  const isInternal = comment.is_internal

  return (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback>
            {comment.user?.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>

      {/* Content */}
      <Card className={`flex-1 mb-4 ${isInternal ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{comment.user?.full_name || 'Unknown User'}</p>
              {isInternal && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Internal Note
                </Badge>
              )}
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </time>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Comment Attachments */}
          {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
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
