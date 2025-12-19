'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Paperclip, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
        <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
          {/* Subtle gradient accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f3463] via-[#2cafdd] to-[#1f3463]" />
          
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
              <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2cafdd]" />
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-muted/20 p-3 border border-border/30 hover:border-border/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {ticket.category}
                  {ticket.subcategory && (
                    <span className="text-muted-foreground"> / {ticket.subcategory}</span>
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-muted/20 p-3 border border-border/30 hover:border-border/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5 ring-2 ring-background">
                    <AvatarImage src={ticket.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#1f3463] to-[#2cafdd] text-white">
                      {ticket.user?.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{ticket.user?.full_name || 'Unknown'}</span>
                </div>
              </div>

              {ticket.assigned_to && ticket.assigned_user ? (
                <div className="rounded-lg bg-muted/20 p-3 border border-border/30 hover:border-border/50 transition-colors">
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 ring-2 ring-background">
                      <AvatarImage src={ticket.assigned_user.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#2cafdd] to-[#1f3463] text-white">
                        {ticket.assigned_user.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{ticket.assigned_user.full_name}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/20 p-3 border border-border/30 border-dashed">
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                </div>
              )}

              <div className="rounded-lg bg-muted/20 p-3 border border-border/30 hover:border-border/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="rounded-xl bg-muted/20 p-4 border border-border/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-[#2cafdd]" />
                  Attachments
                  <span className="text-xs font-normal text-muted-foreground">({attachments.length})</span>
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <AttachmentItem key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2cafdd]/50 via-[#1f3463]/50 to-[#2cafdd]/50" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2cafdd] animate-pulse" />
              Activity Timeline
            </CardTitle>
            <CardDescription>Track all changes and updates to this ticket</CardDescription>
          </CardHeader>
          <CardContent>
            <TicketTimeline
              activities={activities}
              comments={comments}
              isStaff={isStaff}
            />
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f3463]/50 via-[#2cafdd]/50 to-[#1f3463]/50" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              💬 Comments & Discussion
            </CardTitle>
            <CardDescription>
              {isStaff
                ? 'Add public comments or internal notes (visible only to staff)'
                : 'Add comments to communicate with support staff'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Input */}
            <div className="rounded-xl bg-muted/20 p-4 border border-border/30">
              <CommentBox ticketId={ticket.id} isStaff={isStaff} />
            </div>

            {/* Comment List */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                All Comments
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {comments.length}
                </span>
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
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-border hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{getFileIcon(attachment.mime_type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-[#2cafdd] transition-colors">{attachment.filename}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-muted">{formatBytes(attachment.size_bytes)}</span>
            <span>•</span>
            <span>{attachment.user.full_name}</span>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-shrink-0 hover:bg-[#2cafdd]/10 hover:text-[#2cafdd] hover:border-[#2cafdd]/50 transition-all duration-200"
      >
        <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
        <span className="sr-only">
          {isDownloading ? 'Downloading...' : `Download ${attachment.filename}`}
        </span>
      </Button>
    </div>
  )
}
