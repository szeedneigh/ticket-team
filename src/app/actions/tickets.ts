'use server'

/**
 * Ticket Server Actions
 *
 * Server-side actions for ticket creation, updates, and management.
 * All actions enforce RLS and log activities for audit trail.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  createTicketSchema,
  FILE_UPLOAD,
  isValidFileSizeForConfig,
  isValidFileTypeForConfig,
} from '@/lib/validations/tickets'
import { getAttachmentConfig, getSystemConfig } from '@/lib/settings/actions'
import { uploadTicketAttachment } from '@/lib/tickets/storage'
import { pickAssigneeForTicket } from '@/lib/tickets/assignment'
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types'
import { ERROR_MESSAGES } from '@/lib/constants'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'
import {
  notifyTicketAssignment,
  notifyTicketStatusChange,
} from '@/lib/email/notifications'
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

interface AttachmentRecord {
  id: string
  ticket_id: string
  filename: string
  size_bytes: number
  mime_type: string
  storage_path: string
  uploaded_by: string
}

// ============================================================================
// Create Ticket Action
// ============================================================================

/**
 * Create a new support ticket with optional file attachments
 *
 * @param formData - Form data containing ticket details and files
 * @returns Response with created ticket or error
 */
export async function createTicket(
  formData: FormData
): Promise<ServerActionResponse<{ id: string; title: string }>> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tickets.ts:60',message:'createTicket: Called',data:{title:formData.get('title')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
  // #endregion

  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Extract and validate form data
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const subcategory = (formData.get('subcategory') as string) || null
    const priority = formData.get('priority') as string

    // Validate with Zod schema
    const validation = createTicketSchema.safeParse({
      title,
      description,
      category,
      subcategory,
      priority,
    })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || ERROR_MESSAGES.INVALID_INPUT,
      }
    }

    // 3. Get attachment config and extract/validate files
    const attachmentConfig = await getAttachmentConfig()
    const fileCount = parseInt(formData.get('file_count') as string) || 0
    const files: File[] = []

    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File
      if (file && file.size > 0) {
        // Log file details for debugging
        logger.info('Processing file upload', {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          extension: file.name.split('.').pop(),
        })

        // Validate file size (config-aware)
        if (!isValidFileSizeForConfig(file.size, attachmentConfig)) {
          logger.error('File size validation failed', {
            filename: file.name,
            size: file.size,
            maxSize: attachmentConfig.maxFileSizeBytes,
          })
          return {
            success: false,
            error: `File "${file.name}" exceeds maximum size of ${attachmentConfig.maxFileSizeBytes / 1024 / 1024}MB`,
          }
        }

        // Validate file type (config-aware)
        if (!isValidFileTypeForConfig(file, attachmentConfig)) {
          logger.error('File type validation failed', {
            filename: file.name,
            mimeType: file.type,
            extension: file.name.split('.').pop(),
            allowedTypes: attachmentConfig.allowedMimeTypes,
          })
          return {
            success: false,
            error: `File "${file.name}" has an unsupported file type. Allowed: Images (JPG, PNG, GIF, WebP), Documents (PDF, Word, Excel, PowerPoint), Text files, Archives (ZIP, RAR)`,
          }
        }

        logger.info('File validation passed', {
          filename: file.name,
          mimeType: file.type,
        })

        files.push(file)
      }
    }

    // Check max files limit
    if (files.length > FILE_UPLOAD.MAX_FILES) {
      return {
        success: false,
        error: `Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`,
      }
    }

    // 4. Create ticket record
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tickets.ts:162',message:'createTicket: About to INSERT ticket',data:{title:validation.data.title,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: validation.data.title,
        description: validation.data.description,
        category: validation.data.category,
        subcategory: validation.data.subcategory,
        priority: validation.data.priority,
        user_id: user.id,
        status: 'open',
      })
      .select('id, title')
      .single()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tickets.ts:178',message:'createTicket: INSERT completed',data:{ticketId:ticket?.id,hasError:!!ticketError,errorMsg:ticketError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion

    if (ticketError || !ticket) {
      logger.error('Ticket creation error', { error: ticketError?.message })
      return {
        success: false,
        error: 'Failed to create ticket',
      }
    }

    // 4.5. Auto-assignment (if enabled)
    const config = await getSystemConfig()
    if (config?.auto_assignment_enabled) {
      const staffId = await pickAssigneeForTicket({
        category: validation.data.category,
        priority: validation.data.priority,
      })
      if (staffId) {
        const serviceClient = createServiceClient()
        const { error: updateError } = await serviceClient
          .from('tickets')
          .update({
            assigned_to: staffId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ticket.id)

        if (!updateError) {
          const { data: assigneeData } = await serviceClient
            .from('users')
            .select('full_name')
            .eq('id', staffId)
            .single()

          await serviceClient.from('ticket_activities').insert({
            ticket_id: ticket.id,
            user_id: null,
            action: ACTIVITY_TYPES.TICKET_ASSIGNED,
            old_value: null,
            new_value: staffId,
            metadata: {
              auto_assigned: true,
              assigned_to_name: assigneeData?.full_name || 'Staff',
            },
          })

          notifyTicketAssignment(ticket.id, staffId, 'System').catch((err) => {
            logger.error('Auto-assignment email error', { error: err, ticketId: ticket.id })
          })
        }
      }
    }

    // 5. Upload file attachments (if any)
    const attachmentRecords: AttachmentRecord[] = []

    if (files.length > 0) {
      try {
        // Upload files to Supabase Storage
        for (const file of files) {
          const uploadResult = await uploadTicketAttachment(
            file,
            ticket.id,
            user.id
          )

          if (!uploadResult.success || !uploadResult.path) {
            logger.error('File upload failed', { error: uploadResult.error })
            // Continue with other files even if one fails
            continue
          }

          // Create attachment record in database
          const { data: attachment, error: attachmentError } = await supabase
            .from('attachments')
            .insert({
              ticket_id: ticket.id,
              filename: file.name,
              size_bytes: file.size,
              mime_type: file.type,
              storage_path: uploadResult.path,
              uploaded_by: user.id,
              comment_id: null, // Null for ticket attachments (vs comment attachments)
            })
            .select()
            .single()

          if (attachmentError) {
            logger.error('Attachment record creation error', { error: attachmentError.message })
            continue
          }

          attachmentRecords.push(attachment)
        }
      } catch (uploadError) {
        logger.error('File upload process error', { 
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error' 
        })
        // Don't fail ticket creation if uploads fail
      }
    }

    // 6. Log activity using service client (bypass RLS for system actions)
    try {
      const serviceClient = createServiceClient()

      await serviceClient.from('ticket_activities').insert({
        ticket_id: ticket.id,
        user_id: user.id,
        action: ACTIVITY_TYPES.TICKET_CREATED,
        metadata: {
          title: ticket.title,
          category: validation.data.category,
          subcategory: validation.data.subcategory,
          priority: validation.data.priority,
          attachments_count: attachmentRecords.length,
        },
      })

      // Log attachment activities
      for (const attachment of attachmentRecords) {
        await serviceClient.from('ticket_activities').insert({
          ticket_id: ticket.id,
          user_id: user.id,
          action: ACTIVITY_TYPES.ATTACHMENT_ADDED,
          metadata: {
            filename: attachment.filename,
            file_size: attachment.size_bytes,
            file_type: attachment.mime_type,
          },
        })
      }
    } catch (activityError) {
      // Log error but don't fail ticket creation
      logger.error('Activity logging error', { 
        error: activityError instanceof Error ? activityError.message : 'Unknown error' 
      })
    }

    // 6b. Log AI event for learning (async, don't block)
    logAIEvent({
      eventType: 'ticket_created',
      surface: 'ticket_composer',
      content: `${validation.data.title}\n\n${validation.data.description}`,
      ticketId: ticket.id,
      metadata: {
        category: validation.data.category,
        subcategory: validation.data.subcategory,
        priority: validation.data.priority,
        attachments_count: attachmentRecords.length,
      },
    }).catch(error => {
      logger.error('AI event logging error', { error })
    })

    // 7. Revalidate relevant paths
    revalidatePath('/tickets')
    revalidatePath(`/tickets/${ticket.id}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      data: {
        id: ticket.id,
        title: ticket.title,
      },
    }
  } catch (error) {
    logger.error('Unexpected error in createTicket', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}

// ============================================================================
// Update Ticket Status
// ============================================================================

/**
 * Update ticket status
 *
 * @param ticketId - The ticket ID to update
 * @param newStatus - The new status
 * @param resolutionNotes - Optional resolution notes (required when resolving if system config requires it)
 * @returns Response indicating success or error
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  resolutionNotes?: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user and check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['staff', 'admin', 'super_admin'].includes(userData.role)) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Get current ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        error: ERROR_MESSAGES.TICKET_NOT_FOUND,
      }
    }

    if (ticket.status === newStatus) {
      return {
        success: true, // No change needed
      }
    }

    // 2.5. When resolving, check require_resolution_notes and include resolution_notes
    if (newStatus === 'resolved') {
      const config = await getSystemConfig()
      const notes = resolutionNotes?.trim() ?? ''
      if (config?.require_resolution_notes && !notes) {
        return {
          success: false,
          error: 'Resolution notes are required when resolving tickets.',
        }
      }
    }

    // 3. Update ticket status
    const updateData: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Set resolved_at or closed_at timestamps
    if (newStatus === 'resolved' && ticket.status !== 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolution_notes = resolutionNotes?.trim() || null
    } else if (newStatus === 'closed' && ticket.status !== 'closed') {
      updateData.closed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)

    if (updateError) {
      logger.error('Ticket status update error', { error: updateError.message, ticketId })
      return {
        success: false,
        error: 'Failed to update ticket status',
      }
    }

    // 3.5. Send email notification (non-blocking)
    try {
      // Get current user's name for email
      const { data: currentUserData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const changedByName = currentUserData?.full_name || 'Staff'

      // Determine appropriate message based on status
      let message: string | undefined
      if (newStatus === 'resolved') {
        message = 'Your ticket has been resolved. Please review and provide feedback if satisfied.'
      } else if (newStatus === 'closed') {
        message = 'Your ticket has been closed.'
      }

      await notifyTicketStatusChange(ticketId, newStatus, changedByName, message)
    } catch (emailError) {
      // Log error but don't fail the status update
      logger.error('Email notification error', { 
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
        ticketId
      })
    }

    // 4. Log activity
    try {
      const serviceClient = createServiceClient()

      await serviceClient.from('ticket_activities').insert({
        ticket_id: ticketId,
        user_id: user.id,
        action: ACTIVITY_TYPES.STATUS_CHANGED,
        old_value: ticket.status,
        new_value: newStatus,
        metadata: {
          from: ticket.status,
          to: newStatus,
        },
      })
    } catch (activityError) {
      console.error('Activity logging error:', activityError)
      // Don't fail the update
    }

    // 4b. Log AI event for learning (async, don't block)
    logAIEvent({
      eventType: 'ticket_status_change',
      surface: 'ticket_view',
      content: `Status changed from ${ticket.status} to ${newStatus}`,
      ticketId,
      metadata: {
        old_status: ticket.status,
        new_status: newStatus,
      },
    }).catch(error => {
      logger.error('AI event logging error', { error })
    })

    // 5. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    logger.error('Unexpected error in updateTicketStatus', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}

// ============================================================================
// Cancel Ticket by Submitter (Employee)
// ============================================================================

/**
 * Cancel a ticket - employees can cancel tickets they created
 * Only for tickets in open, in_progress, or on_hold status
 *
 * @param ticketId - The ticket ID to cancel
 * @returns Response indicating success or error
 */
export async function cancelTicketBySubmitter(
  ticketId: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Get ticket and verify submitter
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status, user_id')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        error: ERROR_MESSAGES.TICKET_NOT_FOUND,
      }
    }

    if (ticket.user_id !== user.id) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    const cancelableStatuses: TicketStatus[] = ['open', 'in_progress', 'on_hold']
    if (!cancelableStatuses.includes(ticket.status as TicketStatus)) {
      return {
        success: false,
        error: 'Only open, in progress, or on hold tickets can be canceled.',
      }
    }

    // 3. Update status to canceled
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)

    if (updateError) {
      logger.error('Ticket cancel error', { error: updateError.message, ticketId })
      return {
        success: false,
        error: 'Failed to cancel ticket',
      }
    }

    // 4. Log activity
    try {
      const serviceClient = createServiceClient()

      await serviceClient.from('ticket_activities').insert({
        ticket_id: ticketId,
        user_id: user.id,
        action: ACTIVITY_TYPES.STATUS_CHANGED,
        old_value: ticket.status,
        new_value: 'canceled',
        metadata: {
          from: ticket.status,
          to: 'canceled',
        },
      })
    } catch (activityError) {
      console.error('Activity logging error:', activityError)
    }

    // 5. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    logger.error('Unexpected error in cancelTicketBySubmitter', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}

// ============================================================================
// Assign Ticket
// ============================================================================

/**
 * Assign ticket to a staff member
 *
 * @param ticketId - The ticket ID to assign
 * @param assignedTo - The user ID to assign to ('unassigned' to unassign)
 * @returns Response indicating success or error
 */
export async function assignTicket(
  ticketId: string,
  assignedTo: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user and check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['staff', 'admin', 'super_admin'].includes(userData.role)) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Get current ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, assigned_to, status')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        error: ERROR_MESSAGES.TICKET_NOT_FOUND,
      }
    }

    // 3. Determine new assignment
    const newAssignedTo = assignedTo === 'unassigned' ? null : assignedTo

    if (ticket.assigned_to === newAssignedTo) {
      return {
        success: true, // No change needed
      }
    }

    // 3.5. Check reassignment policy (when changing from one assignee to another)
    if (ticket.assigned_to && newAssignedTo && ticket.assigned_to !== newAssignedTo) {
      const config = await getSystemConfig()
      if (!config?.allow_ticket_reassignment) {
        return {
          success: false,
          error: 'Ticket reassignment is disabled by system configuration.',
        }
      }
    }

    // 4. Update ticket assignment (and optionally status)
    const updateData: {
      assigned_to: string | null
      updated_at: string
      status?: TicketStatus
    } = {
      assigned_to: newAssignedTo,
      updated_at: new Date().toISOString(),
    }

    // When assigning an open ticket, automatically move it to in_progress
    if (newAssignedTo && ticket.status === 'open') {
      updateData.status = 'in_progress'
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)

    if (updateError) {
      logger.error('Ticket assignment error', { error: updateError.message, ticketId })
      return {
        success: false,
        error: 'Failed to assign ticket',
      }
    }

    // 5. Get assignee info for activity log
    let assigneeName = 'Unassigned'
    if (newAssignedTo) {
      const { data: assigneeData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', newAssignedTo)
        .single()

      if (assigneeData) {
        assigneeName = assigneeData.full_name
      }
    }

    // 5.5. Send email notification (non-blocking)
    if (newAssignedTo) {
      try {
        // Get current user's name for email
        const { data: currentUserData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const assignedByName = currentUserData?.full_name || 'Staff'
        await notifyTicketAssignment(ticketId, newAssignedTo, assignedByName)
      } catch (emailError) {
        // Log error but don't fail the assignment
        logger.error('Email notification error', { 
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          ticketId
        })
      }
    }

    // 6. Log activity
    try {
      const serviceClient = createServiceClient()

      const action = ticket.assigned_to
        ? newAssignedTo
          ? ACTIVITY_TYPES.ASSIGNMENT_CHANGED
          : ACTIVITY_TYPES.TICKET_UNASSIGNED
        : ACTIVITY_TYPES.TICKET_ASSIGNED

      await serviceClient.from('ticket_activities').insert({
        ticket_id: ticketId,
        user_id: user.id,
        action,
        old_value: ticket.assigned_to,
        new_value: newAssignedTo,
        metadata: {
          assigned_to_name: assigneeName,
        },
      })
    } catch (activityError) {
      logger.error('Activity logging error', { 
        error: activityError instanceof Error ? activityError.message : 'Unknown error',
        ticketId
      })
      // Don't fail the assignment
    }

    // 6b. Log AI event for learning (async, don't block)
    logAIEvent({
      eventType: 'ticket_assigned',
      surface: 'ticket_view',
      content: `Ticket assigned to ${assigneeName}`,
      ticketId,
      metadata: {
        old_assigned_to: ticket.assigned_to,
        new_assigned_to: newAssignedTo,
        assigned_to_name: assigneeName,
      },
    }).catch(error => {
      logger.error('AI event logging error', { error })
    })

    // 7. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/tickets/queue')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    logger.error('Unexpected error in assignTicket', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}

// ============================================================================
// Update Ticket Priority
// ============================================================================

/**
 * Update ticket priority
 *
 * @param ticketId - The ticket ID to update
 * @param newPriority - The new priority
 * @returns Response indicating success or error
 */
export async function updateTicketPriority(
  ticketId: string,
  newPriority: TicketPriority
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user and check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['staff', 'admin', 'super_admin'].includes(userData.role)) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Get current ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, priority')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        error: ERROR_MESSAGES.TICKET_NOT_FOUND,
      }
    }

    if (ticket.priority === newPriority) {
      return {
        success: true, // No change needed
      }
    }

    // 3. Update ticket priority
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        priority: newPriority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)

    if (updateError) {
      logger.error('Ticket priority update error', { error: updateError.message, ticketId })
      return {
        success: false,
        error: 'Failed to update ticket priority',
      }
    }

    // 4. Log activity
    try {
      const serviceClient = createServiceClient()

      await serviceClient.from('ticket_activities').insert({
        ticket_id: ticketId,
        user_id: user.id,
        action: ACTIVITY_TYPES.PRIORITY_CHANGED,
        old_value: ticket.priority,
        new_value: newPriority,
        metadata: {
          from: ticket.priority,
          to: newPriority,
        },
      })
    } catch (activityError) {
      console.error('Activity logging error:', activityError)
      // Don't fail the update
    }

    // 5. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    logger.error('Unexpected error in updateTicketPriority', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}

// ============================================================================
// Reopen Ticket
// ============================================================================

/**
 * Reopen a resolved or closed ticket
 *
 * @param ticketId - The ticket ID to reopen
 * @param reason - Justification for reopening (required)
 * @returns Response indicating success or error
 */
export async function reopenTicket(
  ticketId: string,
  reason: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient()

    // 1. Validate reason
    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        error: 'Reason must be at least 10 characters',
      }
    }

    // 2. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 3. Get current ticket and user role
    const [ticketResult, userResult] = await Promise.all([
      supabase
        .from('tickets')
        .select('id, status, user_id, resolved_at, closed_at')
        .eq('id', ticketId)
        .single(),
      supabase.from('users').select('role').eq('id', user.id).single(),
    ])

    if (ticketResult.error || !ticketResult.data) {
      return {
        success: false,
        error: ERROR_MESSAGES.TICKET_NOT_FOUND,
      }
    }

    const ticket = ticketResult.data
    const userData = userResult.data

    // 4. Check permissions
    const isSubmitter = ticket.user_id === user.id
    const isStaff =
      userData &&
      ['staff', 'admin', 'super_admin'].includes(userData.role)

    if (!isSubmitter && !isStaff) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 5. Validate status transition
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      return {
        success: false,
        error: ERROR_MESSAGES.CANNOT_REOPEN,
      }
    }

    // 6. Update ticket status and clear timestamps
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'open',
        resolved_at: null,
        closed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)

    if (updateError) {
      logger.error('Ticket reopen error', { error: updateError.message, ticketId })
      return {
        success: false,
        error: 'Failed to reopen ticket',
      }
    }

    // 7. Log activity
    try {
      const serviceClient = createServiceClient()

      await serviceClient.from('ticket_activities').insert({
        ticket_id: ticketId,
        user_id: user.id,
        action: ACTIVITY_TYPES.TICKET_REOPENED,
        old_value: ticket.status,
        new_value: 'open',
        metadata: {
          reason: reason.trim(),
          from_status: ticket.status,
        },
      })
    } catch (activityError) {
      logger.error('Activity logging error', { 
        error: activityError instanceof Error ? activityError.message : 'Unknown error',
        ticketId
      })
      // Don't fail the reopen
    }

    // 8. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    logger.error('Unexpected error in reopenTicket', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticketId
    })
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}

// ============================================================================
// Attachment Actions
// ============================================================================

/**
 * Get signed download URL for an attachment
 * @param attachmentId - ID of the attachment to download
 * @returns Signed URL for secure download
 */
export async function getAttachmentDownloadUrl(
  attachmentId: string
): Promise<ServerActionResponse<{ url: string }>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Fetch attachment details
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .select('id, ticket_id, storage_path, filename')
      .eq('id', attachmentId)
      .is('deleted_at', null)
      .single()

    if (attachmentError || !attachment) {
      return { success: false, error: 'Attachment not found' }
    }

    // Check if user has access to this ticket (RLS will handle this)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, user_id')
      .eq('id', attachment.ticket_id)
      .single()

    if (ticketError || !ticket) {
      return { success: false, error: 'Access denied' }
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(attachment.storage_path, 3600)

    if (signedError || !signedData) {
      logger.error('Error creating signed URL', { error: signedError?.message, attachmentId })
      return { success: false, error: 'Failed to generate download URL' }
    }

    // Log the download activity
    await supabase.from('ticket_activities').insert({
      ticket_id: attachment.ticket_id,
      user_id: user.id,
      action: 'file_downloaded',
      description: `Downloaded file: ${attachment.filename}`,
    })

    return {
      success: true,
      data: { url: signedData.signedUrl },
    }
  } catch (error) {
    logger.error('Download attachment error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      attachmentId
    })
    return { success: false, error: 'An unexpected error occurred' }
  }
}
