'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Paperclip, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from './status-badge'
import { PriorityBadge } from './priority-badge'
import { TicketTimeline } from './ticket-timeline'
import { TicketActions } from './ticket-actions'
import { CommentBox } from './comment-box'
import { CommentList } from './comment-list'
import { FeedbackPrompt } from './feedback-prompt'
import { getAttachmentDownloadUrl } from '@/app/actions/tickets'
import { hasFeedback } from '@/app/actions/feedback'
import type { TicketWithUser, TicketCommentWithUser, TicketActivityWithUser } from '@/lib/types/tickets'
import type { User as UserType } from '@/lib/types/users'

/**
 * Ticket Detail Component
 *
 * Main component for displaying full ticket details.
 * Features:
 * - Full ticket information
 * - Status timeline
 * - File attachment list with download
 * - Staff-only action buttons
 * - Role-based UI
 */

interface Attachment {
  id: string
  filename: string
  storage_path: string
  mime_type: string
  size_bytes: number
  created_at: string
  uploaded_by: string
  user: {
    id: string
    full_name: string
    email: string
  }
}

interface TicketDetailProps {
  ticket: TicketWithUser
  comments: TicketCommentWithUser[]
  activities: TicketActivityWithUser[]
  attachments: Attachment[]
  staffUsers: UserType[]
  currentUserId: string
  isStaff: boolean
}

export function TicketDetail({
  ticket,
  comments,
  activities,
  attachments,
  staffUsers,
  currentUserId,
  isStaff,
}: TicketDetailProps) {
  const isSubmitter = ticket.user_id === currentUserId
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)
  const [feedbackAlreadySubmitted, setFeedbackAlreadySubmitted] = useState(false)

  // Check if feedback prompt should be shown
  useEffect(() => {
    const checkFeedback = async () => {
      // Only show prompt for resolved tickets where user is the submitter
      if (ticket.status === 'resolved' && isSubmitter && !isStaff) {
        const hasSubmittedFeedback = await hasFeedback(ticket.id)
        setFeedbackAlreadySubmitted(hasSubmittedFeedback)

        // Show prompt if feedback hasn't been submitted yet
        if (!hasSubmittedFeedback) {
          setShowFeedbackPrompt(true)
        }
      }
    }

    checkFeedback()
  }, [ticket.id, ticket.status, isSubmitter, isStaff])

  const handleFeedbackSubmitted = () => {
    setFeedbackAlreadySubmitted(true)
    setShowFeedbackPrompt(false)
  }

  return (
    <>
      {/* Feedback Prompt Dialog */}
      {showFeedbackPrompt && !feedbackAlreadySubmitted && (
        <FeedbackPrompt
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          isOpen={showFeedbackPrompt}
          onClose={() => setShowFeedbackPrompt(false)}
          onSubmitted={handleFeedbackSubmitted}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Ticket Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                <CardDescription>
                  Ticket #{ticket.id.slice(0, 8)} • Submitted{' '}
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {ticket.description}
              </p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium">
                  {ticket.category}
                  {ticket.subcategory && ` / ${ticket.subcategory}`}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Submitted By</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ticket.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {ticket.user?.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{ticket.user?.full_name || 'Unknown'}</span>
                </div>
              </div>

              {ticket.assigned_to && ticket.assigned_user && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={ticket.assigned_user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {ticket.assigned_user.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{ticket.assigned_user.full_name}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <AttachmentItem key={attachment.id} attachment={attachment} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
          <TicketTimeline
            activities={activities}
            comments={comments}
            isStaff={isStaff}
          />
        </div>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments & Discussion</CardTitle>
            <CardDescription>
              {isStaff
                ? 'Add public comments or internal notes (visible only to staff)'
                : 'Add comments to communicate with support staff'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Input */}
            <CommentBox ticketId={ticket.id} isStaff={isStaff} />

            <Separator />

            {/* Comment List */}
            <div>
              <h3 className="text-sm font-medium mb-4">
                All Comments ({comments.length})
              </h3>
              <CommentList comments={comments} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions (Staff or Submitter for reopen) */}
        <TicketActions
          ticket={ticket}
          staffUsers={staffUsers}
          currentUserId={currentUserId}
          isStaff={isStaff}
          isSubmitter={isSubmitter}
        />
      </div>
    </div>
    </>
  )
}

// ============================================================================
// Attachment Item Component
// ============================================================================

interface AttachmentItemProps {
  attachment: Attachment
}

function AttachmentItem({ attachment }: AttachmentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
    if (mimeType.startsWith('text/')) return '📃'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
    return '📎'
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Get signed download URL from server action
      const result = await getAttachmentDownloadUrl(attachment.id)

      if (!result.success || !result.data?.url) {
        toast.error(result.error || 'Failed to download file')
        return
      }

      // Trigger browser download
      const link = document.createElement('a')
      link.href = result.data.url
      link.download = attachment.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Downloading ${attachment.filename}`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{getFileIcon(attachment.mime_type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.filename}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatBytes(attachment.size_bytes)}</span>
            <span>•</span>
            <span>{attachment.user.full_name}</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-shrink-0"
      >
        <Download className={`h-4 w-4 ${isDownloading ? 'animate-pulse' : ''}`} />
        <span className="sr-only">
          {isDownloading ? 'Downloading...' : `Download ${attachment.filename}`}
        </span>
      </Button>
    </div>
  )
}
