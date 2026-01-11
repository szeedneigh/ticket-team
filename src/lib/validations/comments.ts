import { z } from 'zod'

/**
 * Comment Validation Schemas
 *
 * Zod schemas for validating comment creation and management.
 * Used by Server Actions to ensure data integrity.
 */

// ============================================================================
// Constants
// ============================================================================

export const COMMENT_MAX_LENGTH = 5000

export const COMMENT_FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  MAX_FILES: 5, // Max files per comment
} as const

// ============================================================================
// Schemas
// ============================================================================

/**
 * Comment creation schema
 *
 * Validates:
 * - ticket_id: Valid UUID
 * - content: 1-5000 characters, trimmed
 * - is_internal: Boolean flag for staff-only notes
 */
export const createCommentSchema = z.object({
  ticket_id: z.string().uuid('Invalid ticket ID'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(COMMENT_MAX_LENGTH, `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters`)
    .trim(),
  is_internal: z.boolean().default(false),
})

// ============================================================================
// Type Inference
// ============================================================================

export type CreateCommentInput = z.infer<typeof createCommentSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if file size is within allowed limit
 */
export function isValidCommentFileSize(size: number): boolean {
  return size > 0 && size <= COMMENT_FILE_UPLOAD.MAX_SIZE
}

/**
 * File extension to MIME type mapping for comments (for fallback validation)
 */
const COMMENT_FILE_EXTENSION_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
}

/**
 * Check if file MIME type is allowed (checks both MIME type and extension)
 */
export function isValidCommentFileType(file: File | string, filename?: string): boolean {
  const mimeType = typeof file === 'string' ? file : file.type
  const fileName = typeof file === 'string' ? (filename || '') : file.name
  const extension = fileName.split('.').pop()?.toLowerCase()

  // Check MIME type first
  if ((COMMENT_FILE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
    return true
  }

  // Fallback: Check extension if MIME type detection fails
  if (extension && COMMENT_FILE_EXTENSION_MAP[extension]) {
    const expectedMimeType = COMMENT_FILE_EXTENSION_MAP[extension]
    
    // If browser didn't provide MIME type or provided generic type, trust extension
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
      return true
    }
    
    // Allow if extension matches expected MIME type
    return expectedMimeType === mimeType
  }

  return false
}

/**
 * Get human-readable max file size
 */
export function getMaxFileSizeLabel(): string {
  return `${COMMENT_FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`
}

/**
 * Get allowed file types as accept string for input
 */
export function getAcceptedFileTypes(): string {
  return 'image/*,.pdf,.doc,.docx,.txt'
}
