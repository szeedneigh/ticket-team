/**
 * Templates and Canned Responses Types
 *
 * Type definitions for ticket templates and canned responses features.
 *
 * @module lib/types/templates
 */

import type { TicketPriority } from './database'

/**
 * Ticket Template
 */
export interface TicketTemplate {
  id: string
  name: string
  description: string | null
  title_template: string
  description_template: string
  category: string
  subcategory: string | null
  priority: TicketPriority
  tags: string[]
  is_active: boolean
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  creator?: {
    id: string
    full_name: string
    email: string
  }
}

/**
 * Canned Response
 */
export interface CannedResponse {
  id: string
  title: string
  content: string
  category: string | null
  shortcut: string | null
  is_active: boolean
  usage_count: number
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  creator?: {
    id: string
    full_name: string
    email: string
  }
}

/**
 * Create/Update Template Input
 */
export interface TemplateInput {
  name: string
  description?: string
  title_template: string
  description_template: string
  category: string
  subcategory?: string
  priority: TicketPriority
  tags?: string[]
  is_active?: boolean
}

/**
 * Create/Update Canned Response Input
 */
export interface CannedResponseInput {
  title: string
  content: string
  category?: string
  shortcut?: string
  is_active?: boolean
}

/**
 * Template Filter Options
 */
export interface TemplateFilters {
  search?: string
  category?: string
  is_active?: boolean
}

/**
 * Canned Response Filter Options
 */
export interface CannedResponseFilters {
  search?: string
  category?: string
  is_active?: boolean
}

/**
 * Feedback with ticket details
 */
export interface FeedbackWithDetails {
  id: string
  ticket_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  ticket: {
    id: string
    title: string
    category: string
    status: string
    created_at: string
  }
  user: {
    id: string
    full_name: string
    email: string
  }
}

/**
 * Feedback summary statistics
 */
export interface FeedbackSummary {
  totalFeedback: number
  averageRating: number
  ratingDistribution: {
    rating: number
    count: number
    percentage: number
  }[]
  recentTrend: {
    date: string
    avgRating: number
    count: number
  }[]
}
