import { z } from 'zod'

/**
 * Ticket Validation Schemas
 *
 * Zod schemas for validating ticket creation and updates.
 * Aligns with database constraints and business rules.
 */

// ============================================================================
// File Validation Constants
// ============================================================================

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_FILE_TYPES: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    // Text
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
  ],
  MAX_FILES: 5, // Maximum number of files per ticket
} as const

// ============================================================================
// Ticket Creation Schema
// ============================================================================

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),

  category: z
    .string()
    .min(1, 'Category is required')
    .trim(),

  subcategory: z.string().nullable().optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical'], {
    errorMap: () => ({ message: 'Priority must be low, medium, high, urgent, or critical' }),
  }),

  // Optional: AI escalation metadata (for future chatbot integration)
  escalated_from_ai: z.boolean().optional(),
  ai_interaction_id: z.string().uuid().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

// ============================================================================
// File Upload Validation Schema
// ============================================================================

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= FILE_UPLOAD.MAX_FILE_SIZE,
      `File size must be less than ${FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`
    )
    .refine(
      (file) => (FILE_UPLOAD.ALLOWED_FILE_TYPES as readonly string[]).includes(file.type),
      'File type not allowed. Allowed types: images, PDFs, Office documents, text files, and archives'
    ),
})

export const multipleFilesUploadSchema = z
  .array(fileUploadSchema)
  .max(
    FILE_UPLOAD.MAX_FILES,
    `Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`
  )

// ============================================================================
// Ticket Update Schema (for future use in Chunk 3)
// ============================================================================

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim()
    .optional(),

  category: z
    .string()
    .min(1, 'Category is required')
    .trim()
    .optional(),

  subcategory: z
    .string()
    .nullable()
    .optional(),

  priority: z
    .enum(['low', 'medium', 'high'])
    .optional(),

  status: z
    .enum(['open', 'in_progress', 'on_hold', 'resolved', 'closed', 'canceled'])
    .optional(),

  resolution_notes: z
    .string()
    .max(2000, 'Resolution notes must not exceed 2000 characters')
    .trim()
    .nullable()
    .optional(),
})

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Attachment config for config-aware validation (matches settings AttachmentConfig)
 */
export interface AttachmentConfig {
  maxFileSizeBytes: number
  allowedMimeTypes: string[]
}

/**
 * File extension to MIME type mapping (for fallback validation)
 */
export const FILE_EXTENSION_MAP: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  txt: 'text/plain',
  csv: 'text/csv',
  // Archives
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
}

/**
 * Validate file type (checks both MIME type and extension)
 */
export function isValidFileType(file: File | string, filename?: string): boolean {
  const mimeType = typeof file === 'string' ? file : file.type
  const fileName = typeof file === 'string' ? (filename || '') : file.name
  const extension = fileName.split('.').pop()?.toLowerCase()

  // Check MIME type first
  if ((FILE_UPLOAD.ALLOWED_FILE_TYPES as readonly string[]).includes(mimeType)) {
    return true
  }

  // Fallback: Check extension if MIME type detection fails or is generic
  if (extension && FILE_EXTENSION_MAP[extension]) {
    const expectedMimeType = FILE_EXTENSION_MAP[extension]
    
    // If browser didn't provide MIME type or provided generic type, trust extension
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
      return true
    }
    
    // Allow if extension matches expected MIME type (browser may have wrong MIME)
    return expectedMimeType === mimeType
  }

  return false
}

/**
 * Validate file size
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize <= FILE_UPLOAD.MAX_FILE_SIZE
}

/**
 * Validate file size against config (falls back to FILE_UPLOAD when config is null)
 */
export function isValidFileSizeForConfig(
  fileSize: number,
  config: AttachmentConfig | null
): boolean {
  if (!config) return isValidFileSize(fileSize)
  return fileSize <= config.maxFileSizeBytes
}

/**
 * Validate file type against config (falls back to default when config is null)
 */
export function isValidFileTypeForConfig(
  file: File | string,
  config: AttachmentConfig | null,
  filename?: string
): boolean {
  if (!config) return isValidFileType(file, filename)
  const mimeType = typeof file === 'string' ? file : file.type
  const fileName = typeof file === 'string' ? (filename || '') : file.name
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (config.allowedMimeTypes.includes(mimeType)) return true
  if (extension && FILE_EXTENSION_MAP[extension]) {
    const expectedMimeType = FILE_EXTENSION_MAP[extension]
    if (config.allowedMimeTypes.includes(expectedMimeType)) {
      if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
        return true
      }
      return expectedMimeType === mimeType
    }
  }
  return false
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove special characters, keep alphanumeric, dots, dashes, underscores
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase()
}
