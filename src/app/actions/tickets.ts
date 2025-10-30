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
  isValidFileSize,
  isValidFileType,
} from '@/lib/validations/tickets'
import { uploadTicketAttachment } from '@/lib/tickets/storage'
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types'
import { ERROR_MESSAGES } from '@/lib/constants'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'

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

    // 3. Extract and validate files
    const fileCount = parseInt(formData.get('file_count') as string) || 0
    const files: File[] = []

    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File
      if (file && file.size > 0) {
        // Validate file size and type
        if (!isValidFileSize(file.size)) {
          return {
            success: false,
            error: `File "${file.name}" exceeds maximum size`,
          }
        }

        if (!isValidFileType(file.type)) {
          return {
            success: false,
            error: `File "${file.name}" has an unsupported file type`,
          }
        }

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

    if (ticketError || !ticket) {
      console.error('Ticket creation error:', ticketError)
      return {
        success: false,
        error: 'Failed to create ticket',
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
            console.error('File upload failed:', uploadResult.error)
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
            console.error('Attachment record creation error:', attachmentError)
            continue
          }

          attachmentRecords.push(attachment)
        }
      } catch (uploadError) {
        console.error('File upload process error:', uploadError)
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
      console.error('Activity logging error:', activityError)
    }

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
    console.error('Unexpected error in createTicket:', error)
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
 * @returns Response indicating success or error
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
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

    // 3. Update ticket status
    const updateData: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Set resolved_at or closed_at timestamps
    if (newStatus === 'resolved' && ticket.status !== 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    } else if (newStatus === 'closed' && ticket.status !== 'closed') {
      updateData.closed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)

    if (updateError) {
      console.error('Ticket status update error:', updateError)
      return {
        success: false,
        error: 'Failed to update ticket status',
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

    // 5. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error in updateTicketStatus:', error)
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
      .select('id, assigned_to')
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

    // 4. Update ticket assignment
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        assigned_to: newAssignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)

    if (updateError) {
      console.error('Ticket assignment error:', updateError)
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
      console.error('Activity logging error:', activityError)
      // Don't fail the assignment
    }

    // 7. Revalidate paths
    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/tickets/queue')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error in assignTicket:', error)
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
      console.error('Ticket priority update error:', updateError)
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
    console.error('Unexpected error in updateTicketPriority:', error)
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
      console.error('Ticket reopen error:', updateError)
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
      console.error('Activity logging error:', activityError)
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
    console.error('Unexpected error in reopenTicket:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC,
    }
  }
}
