/**
 * Ticket Domain Types
 * 
 * Type definitions for support tickets, comments, activities, and feedback
 */

import type { TicketStatus, TicketPriority } from './database'
import type { User } from './users'

// ============================================================================
// Ticket Types
// ============================================================================

export interface Ticket {
  id: string
  display_number: string // Human-readable ticket number (e.g., TT-2026-001)
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  subcategory: string | null
  user_id: string
  assigned_to: string | null
  resolution_notes: string | null
  attachments: Record<string, unknown>[] // JSONB array
  metadata: Record<string, unknown> // JSONB object
  created_at: string
  updated_at: string
  resolved_at: string | null
  closed_at: string | null
}

// Ticket with related user data
export interface TicketWithUser extends Ticket {
  user: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url'>
  assigned_user: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}

// ============================================================================
// Ticket Comment Types
// ============================================================================

export interface TicketComment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_internal: boolean
  attachments: Record<string, unknown>[]
  created_at: string
  updated_at: string
}

export interface TicketCommentWithUser extends TicketComment {
  user: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'>
}

// ============================================================================
// Ticket Activity Types
// ============================================================================

export interface TicketActivity {
  id: string
  ticket_id: string
  user_id: string | null
  action: string
  old_value: string | null
  new_value: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface TicketActivityWithUser extends TicketActivity {
  user: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
}

// ============================================================================
// Ticket Feedback Types
// ============================================================================

export interface TicketFeedback {
  id: string
  ticket_id: string
  user_id: string
  rating: number // 1-5
  comment: string | null
  created_at: string
}

// ============================================================================
// Create/Update Types
// ============================================================================

export interface CreateTicketData {
  title: string
  description: string
  priority?: TicketPriority
  category: string
  subcategory?: string
  metadata?: Record<string, unknown>
}

export interface UpdateTicketData {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  subcategory?: string
  assigned_to?: string | null
  resolution_notes?: string
  metadata?: Record<string, unknown>
}

export interface CreateCommentData {
  ticket_id: string
  content: string
  is_internal?: boolean
}

export interface CreateFeedbackData {
  ticket_id: string
  rating: number
  comment?: string
}

// ============================================================================
// Filter/Query Types
// ============================================================================

export type TimePeriod = 'today' | 'this_week' | 'this_month' | 'all'

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[]
  priority?: TicketPriority | TicketPriority[]
  category?: string
  assigned_to?: string
  user_id?: string
  search?: string
  created_after?: string
  created_before?: string
  timePeriod?: TimePeriod
  page?: number
}

export interface TicketListResponse {
  tickets: TicketWithUser[]
  total: number
  page: number
  per_page: number
}

export interface PagedTicketListResponse {
  tickets: TicketWithUser[]
  totalPages: number
  currentPage: number
  totalCount: number
}

// ============================================================================
// Dashboard/Analytics Types
// ============================================================================

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  on_hold: number
  resolved: number
  closed: number
  canceled: number
  high_priority: number
  avg_resolution_time_hours: number
}

export interface CategoryStats {
  category: string
  count: number
  percentage: number
}

