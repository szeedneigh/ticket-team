import { createClient } from '@/lib/supabase/server'
import { sanitizeFilename, formatFileSize } from '@/lib/validations/tickets'

/**
 * Ticket Attachment Storage Utilities
 *
 * Functions for managing file uploads to Supabase Storage for ticket attachments.
 * Uses the 'ticket-attachments' bucket with RLS policies.
 *
 * Storage Path Structure: tickets/{ticket-id}/{filename}
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface UploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
}

export interface AttachmentMetadata {
  id: string
  ticket_id: string
  filename: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_BUCKET = 'ticket-attachments' as const
const SIGNED_URL_EXPIRY = 3600 // 1 hour in seconds

// ============================================================================
// Upload Functions
// ============================================================================

/**
 * Upload a file attachment for a ticket
 *
 * @param file - The file to upload
 * @param ticketId - The ticket ID to associate with
 * @param userId - The user uploading the file
 * @returns Upload result with path and URL
 */
export async function uploadTicketAttachment(
  file: File,
  ticketId: string,
  userId: string
): Promise<UploadResult> {
  try {
    const supabase = await createClient()

    // Sanitize filename to prevent issues
    const timestamp = Date.now()
    const sanitized = sanitizeFilename(file.name)
    const filename = `${timestamp}-${sanitized}`

    // Storage path: tickets/{ticket-id}/{filename}
    const storagePath = `tickets/${ticketId}/${filename}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      }
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Unexpected error during file upload:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during upload',
    }
  }
}

/**
 * Upload multiple files for a ticket
 *
 * @param files - Array of files to upload
 * @param ticketId - The ticket ID to associate with
 * @param userId - The user uploading the files
 * @returns Array of upload results
 */
export async function uploadMultipleTicketAttachments(
  files: File[],
  ticketId: string,
  userId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadTicketAttachment(file, ticketId, userId)
  )

  return Promise.all(uploadPromises)
}

// ============================================================================
// Download/Access Functions
// ============================================================================

/**
 * Get a signed URL for downloading an attachment
 *
 * @param storagePath - The storage path of the file
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL for download
 */
export async function getSignedAttachmentUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { url: null, error: error.message }
    }

    return { url: data.signedUrl, error: null }
  } catch (error) {
    console.error('Unexpected error creating signed URL:', error)
    return { url: null, error: 'Failed to generate download URL' }
  }
}

/**
 * Get public URL for an attachment (for public buckets)
 *
 * @param storagePath - The storage path of the file
 * @returns Public URL
 */
export async function getAttachmentUrl(storagePath: string): Promise<string> {
  const supabase = await createClient()

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  return data.publicUrl
}

// ============================================================================
// Delete Functions
// ============================================================================

/**
 * Delete an attachment from storage
 * Note: This performs a hard delete. Soft delete happens at the database level.
 *
 * @param storagePath - The storage path of the file to delete
 * @returns Success status
 */
export async function deleteTicketAttachment(
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath])

    if (error) {
      console.error('Error deleting file from storage:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting file:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during deletion',
    }
  }
}

/**
 * Delete multiple attachments from storage
 *
 * @param storagePaths - Array of storage paths to delete
 * @returns Success status for each file
 */
export async function deleteMultipleTicketAttachments(
  storagePaths: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(storagePaths)

    if (error) {
      console.error('Error deleting files from storage:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting files:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during deletion',
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a file exists in storage
 *
 * @param storagePath - The storage path to check
 * @returns Boolean indicating if file exists
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(storagePath.split('/').slice(0, -1).join('/'))

    if (error) return false

    const filename = storagePath.split('/').pop()
    return data.some((file) => file.name === filename)
  } catch {
    return false
  }
}

/**
 * Get file metadata from storage
 *
 * @param storagePath - The storage path
 * @returns File metadata if found
 */
export async function getFileMetadata(storagePath: string): Promise<{
  size: number
  mimeType: string
  lastModified: string
} | null> {
  try {
    const supabase = await createClient()

    const folderPath = storagePath.split('/').slice(0, -1).join('/')
    const filename = storagePath.split('/').pop()

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath)

    if (error || !data) return null

    const file = data.find((f) => f.name === filename)

    if (!file) return null

    return {
      size: file.metadata?.size || 0,
      mimeType: file.metadata?.mimetype || 'application/octet-stream',
      lastModified: file.updated_at || file.created_at,
    }
  } catch {
    return null
  }
}

/**
 * Get human-readable file info for display
 *
 * @param file - File object
 * @returns Formatted file information
 */
export function getFileInfo(file: File): {
  name: string
  size: string
  type: string
} {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type || 'Unknown',
  }
}

/**
 * Validate file before upload (client-side check)
 *
 * @param file - File to validate
 * @param maxSizeBytes - Maximum file size in bytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSizeBytes: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatFileSize(maxSizeBytes)}`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    }
  }

  return { valid: true }
}
