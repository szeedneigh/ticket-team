/**
 * API Request/Response Types
 * 
 * Type definitions for API routes, responses, and error handling
 */

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: APIError
  metadata?: {
    timestamp: string
    request_id?: string
    [key: string]: unknown
  }
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
  field?: string // for validation errors
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// ============================================================================
// Common Request Types
// ============================================================================

export interface PaginationParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  q?: string
  filters?: Record<string, unknown>
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ============================================================================
// Server Action Result Types
// ============================================================================

export interface ActionResult {
  success: boolean
  error?: string
  message?: string
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadRequest {
  file: File
  ticket_id?: string
  comment_id?: string
}

export interface FileUploadResponse {
  id: string
  filename: string
  storage_path: string
  mime_type: string
  size_bytes: number
  url: string
}

// ============================================================================
// Bulk Operation Types
// ============================================================================

export interface BulkOperationRequest<T> {
  items: T[]
  validate?: boolean
}

export interface BulkOperationResponse<T> {
  success_count: number
  error_count: number
  results: Array<{
    item: T
    success: boolean
    error?: APIError
  }>
}

// ============================================================================
// Export/Import Types
// ============================================================================

export interface ExportRequest {
  format: 'csv' | 'json' | 'xlsx'
  filters?: Record<string, unknown>
  fields?: string[]
}

export interface ExportResponse {
  download_url: string
  filename: string
  expires_at: string
  size_bytes: number
}

