'use server'

/**
 * Comment Server Actions
 *
 * Server-side actions for comment creation and management.
 * Enforces RLS and logs activities for audit trail.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  createCommentSchema,
  isValidCommentFileSize,
  isValidCommentFileType,
  COMMENT_FILE_UPLOAD,
} from '@/lib/validations/comments'
import { uploadTicketAttachment } from '@/lib/tickets/storage'
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types'
import { ERROR_MESSAGES } from '@/lib/constants'
import { notifyTicketComment } from '@/lib/email/notifications'
import { logger } from '@/lib/logger'
import { logAIEvent } from '@/lib/ai/events'

// ============================================================================
// Types
// ============================================================================

interface ServerActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface CommentUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

interface AttachmentMetadata {
  filename: string
  size_bytes: number
  mime_type: string
  storage_path: string
}

interface CommentWithUser {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_internal: boolean
  attachments: AttachmentMetadata[]
  created_at: string
  updated_at: string
  user: CommentUser
}

// ============================================================================
// Create Comment Action
// ============================================================================

/**
 * Create a new comment on a ticket
 *
 * Features:
 * - Public comments (is_internal=false) for all users
 * - Internal notes (is_internal=true) only for staff/admin/super_admin
 * - Optional file attachments
 * - Activity logging
 * - RLS enforcement
 *
 * @param formData - Form data with comment details and files
 * @returns Response with created comment or error
 */
export async function createComment(
  formData: FormData
): Promise<ServerActionResponse<CommentWithUser>> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Get user profile with role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 3. Extract and validate form data
    const ticket_id = formData.get('ticket_id') as string
    const content = formData.get('content') as string
    const is_internal = formData.get('is_internal') === 'true'

    // Validate with Zod
    const validation = createCommentSchema.safeParse({
      ticket_id,
      content,
      is_internal,
    })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || ERROR_MESSAGES.INVALID_INPUT,
      }
    }

    // 4. CRITICAL: Only staff can create internal notes
    const isStaff = ['staff', 'admin', 'super_admin'].includes(user.role)

    if (is_internal && !isStaff) {
      return {
        success: false,
        error: 'Only staff members can create internal notes',
      }
    }

    // 5. Verify user has access to ticket (RLS will also check)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, user_id, assigned_to')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        error: 'Ticket not found or access denied',
      }
    }

    // 5.5. Creator, assigned staff, or any staff can add comments
    const canComment = ticket.user_id === user.id || ticket.assigned_to === user.id || isStaff
    if (!canComment) {
      return {
        success: false,
        error: 'Only the ticket creator and staff can add comments',
      }
    }

    // 6. Handle file uploads (if any)
    const fileCount = parseInt(formData.get('file_count') as string) || 0
    const attachmentMetadata: AttachmentMetadata[] = []

    if (fileCount > 0) {
      if (fileCount > COMMENT_FILE_UPLOAD.MAX_FILES) {
        return {
          success: false,
          error: `Maximum ${COMMENT_FILE_UPLOAD.MAX_FILES} files allowed per comment`,
        }
      }

      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`) as File
        if (!file) continue

        // Log file details for debugging
        logger.info('Processing comment file upload', {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          extension: file.name.split('.').pop(),
          ticket_id,
        })

        // Validate file size
        if (!isValidCommentFileSize(file.size)) {
          logger.error('Comment file size validation failed', {
            filename: file.name,
            size: file.size,
            maxSize: COMMENT_FILE_UPLOAD.MAX_SIZE,
          })
          return {
            success: false,
            error: `File "${file.name}" exceeds ${COMMENT_FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB limit`,
          }
        }

        // Validate file type (checks both MIME type and extension)
        if (!isValidCommentFileType(file)) {
          logger.error('Comment file type validation failed', {
            filename: file.name,
            mimeType: file.type,
            extension: file.name.split('.').pop(),
            allowedTypes: COMMENT_FILE_UPLOAD.ALLOWED_TYPES,
          })
          return {
            success: false,
            error: `File type "${file.type}" is not allowed. Allowed: Images (JPG, PNG, GIF, WebP), PDF, Word documents, Text files`,
          }
        }

        logger.info('Comment file validation passed', {
          filename: file.name,
          mimeType: file.type,
        })

        // Upload file (reuse ticket storage utility)
        const uploadResult = await uploadTicketAttachment(file, ticket_id, user.id)

        if (!uploadResult.success || !uploadResult.path) {
          logger.error('Comment file upload failed', {
            filename: file.name,
            error: uploadResult.error,
          })
          return {
            success: false,
            error: `Failed to upload "${file.name}"`,
          }
        }

        attachmentMetadata.push({
          filename: file.name,
          size_bytes: file.size,
          mime_type: file.type,
          storage_path: uploadResult.path,
        })
      }
    }

    // 7. Create comment
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        user_id: user.id,
        content: validation.data.content,
        is_internal,
        attachments: attachmentMetadata,
      })
      .select(
        `
        *,
        user:users(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `
      )
      .single()

    if (commentError || !comment) {
      logger.error('Comment creation error', {
        error: commentError?.message || 'Unknown error',
        ticketId: ticket_id
      })
      return {
        success: false,
        error: 'Failed to create comment',
      }
    }

    // 7.5. Send email notification for public comments (non-blocking)
    if (!is_internal) {
      try {
        // Get comment author's full name
        const { data: authorData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const authorName = authorData?.full_name || 'Someone'
        await notifyTicketComment(ticket_id, authorName, validation.data.content)
      } catch (emailError) {
        // Log error but don't fail the comment creation
        logger.error('Email notification error', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          ticketId: ticket_id
        })
      }
    }

    // 8. Log activity (use service client to bypass RLS)
    const serviceClient = createServiceClient()

    const activityType = is_internal
      ? ACTIVITY_TYPES.INTERNAL_NOTE_ADDED
      : ACTIVITY_TYPES.COMMENT_ADDED

    await serviceClient.from('ticket_activities').insert({
      ticket_id,
      user_id: user.id,
      action: activityType,
      metadata: {
        comment_id: comment.id,
        is_internal,
        has_attachments: attachmentMetadata.length > 0,
        attachment_count: attachmentMetadata.length,
      },
    })

    // 8b. Log AI event for learning (async, don't block)
    logAIEvent({
      eventType: 'ticket_comment',
      surface: 'comment_composer',
      content: validation.data.content,
      ticketId: ticket_id,
      commentId: comment.id,
      sensitivity: is_internal ? 'internal' : 'internal',
      metadata: {
        is_internal,
        has_attachments: attachmentMetadata.length > 0,
        attachment_count: attachmentMetadata.length,
      },
    }).catch(error => {
      logger.error('AI event logging error', { error })
    })

    // 9. Revalidate ticket detail page
    revalidatePath(`/tickets/${ticket_id}`)
    revalidatePath('/tickets')

    return {
      success: true,
      data: comment as CommentWithUser,
    }
  } catch (error) {
    logger.error('Create comment error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}
