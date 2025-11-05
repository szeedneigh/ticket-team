'use client'

import { CommentItem } from './comment-item'
import type { TicketCommentWithUser } from '@/lib/types/tickets'
import type { CommentAttachment } from './comment-item'

/**
 * Comment List Component
 *
 * Displays all comments for a ticket.
 * RLS automatically filters internal notes for employees.
 *
 * Features:
 * - Maps comments to CommentItem components
 * - Empty state message
 * - Chronological order (oldest first)
 */

interface CommentListProps {
  comments: TicketCommentWithUser[]
  emptyMessage?: string
}

export function CommentList({
  comments,
  emptyMessage = 'No comments yet. Be the first to comment!',
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          id={comment.id}
          content={comment.content}
          is_internal={comment.is_internal}
          attachments={(comment.attachments as unknown as CommentAttachment[]) || []}
          created_at={comment.created_at}
          user={comment.user}
        />
      ))}
    </div>
  )
}
