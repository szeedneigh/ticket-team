import { formatDistanceToNow } from 'date-fns'
import { Lock, Paperclip } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Comment Item Component
 *
 * Displays a single comment with:
 * - User avatar and name
 * - Timestamp
 * - Internal note badge (if applicable)
 * - Comment content with line breaks
 * - File attachments
 */

interface CommentUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

export interface CommentAttachment {
  filename: string
  size_bytes: number
  mime_type: string
  storage_path: string
}

interface CommentItemProps {
  content: string
  is_internal: boolean
  attachments: CommentAttachment[]
  created_at: string
  user: CommentUser | null
}

export function CommentItem({
  content,
  is_internal,
  attachments,
  created_at,
  user,
}: CommentItemProps) {
  // Handle null user (e.g. deleted/deactivated author)
  const displayName = user?.full_name ?? 'Former User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <Card className={is_internal ? 'border-amber-200 bg-amber-50/50' : ''}>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          {/* User Avatar */}
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={user?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          {/* Comment Content */}
          <div className="flex-1 space-y-2">
            {/* Header: Name, Badge, Time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{displayName}</span>

              {is_internal && (
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                  <Lock className="w-3 h-3 mr-1" />
                  Internal Note
                </Badge>
              )}

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Comment Text */}
            <div className="text-sm whitespace-pre-wrap break-words">{content}</div>

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="space-y-1 mt-3">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span className="font-medium">{attachment.filename}</span>
                    <span>({(attachment.size_bytes / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
