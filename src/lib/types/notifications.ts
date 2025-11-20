/**
 * Notification Types
 *
 * Type definitions for the notifications system.
 *
 * @module lib/types/notifications
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Types of notifications
 */
export type NotificationType =
  | 'ticket_assigned'
  | 'ticket_comment'
  | 'ticket_resolved'
  | 'ticket_status_changed'
  | 'ticket_priority_changed'
  | 'mention'
  | 'system_alert'
  | 'kb_article_published'

/**
 * Human-readable labels for notification types
 */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ticket_assigned: 'Ticket Assigned',
  ticket_comment: 'New Comment',
  ticket_resolved: 'Ticket Resolved',
  ticket_status_changed: 'Status Changed',
  ticket_priority_changed: 'Priority Changed',
  mention: 'Mentioned',
  system_alert: 'System Alert',
  kb_article_published: 'Article Published',
}

/**
 * Icons for notification types (Lucide icon names)
 */
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  ticket_assigned: 'UserPlus',
  ticket_comment: 'MessageSquare',
  ticket_resolved: 'CheckCircle',
  ticket_status_changed: 'RefreshCw',
  ticket_priority_changed: 'AlertTriangle',
  mention: 'AtSign',
  system_alert: 'AlertCircle',
  kb_article_published: 'BookOpen',
}

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base notification entity
 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  ticket_id: string | null
  article_id: string | null
  actor_id: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  archived_at: string | null
  created_at: string
}

/**
 * Notification with actor user details
 */
export interface NotificationWithActor extends Notification {
  actor?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  } | null
}

/**
 * Notification with related entities
 */
export interface NotificationWithRelations extends NotificationWithActor {
  ticket?: {
    id: string
    title: string
    status: string
  } | null
  article?: {
    id: string
    title: string
  } | null
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Filters for querying notifications
 */
export interface NotificationFilters {
  type?: NotificationType | NotificationType[]
  read?: boolean
  archived?: boolean
  created_after?: string
  created_before?: string
  page?: number
  per_page?: number
}

/**
 * Sort options for notifications
 */
export type NotificationSortField = 'created_at' | 'read_at' | 'type'
export type SortDirection = 'asc' | 'desc'

export interface NotificationSort {
  field: NotificationSortField
  direction: SortDirection
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Paginated notifications response
 */
export interface NotificationsResponse {
  notifications: NotificationWithActor[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  unread_count: number
}

/**
 * Notification count summary
 */
export interface NotificationCounts {
  total: number
  unread: number
  by_type: Partial<Record<NotificationType, number>>
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * Create notification input
 */
export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  message: string
  ticket_id?: string
  article_id?: string
  actor_id?: string
  metadata?: Record<string, unknown>
}

/**
 * Mark notification read result
 */
export interface MarkReadResult {
  success: boolean
  notification_id: string
  read_at: string
}

/**
 * Mark all read result
 */
export interface MarkAllReadResult {
  success: boolean
  count: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if notification type is valid
 */
export function isValidNotificationType(type: string): type is NotificationType {
  return [
    'ticket_assigned',
    'ticket_comment',
    'ticket_resolved',
    'ticket_status_changed',
    'ticket_priority_changed',
    'mention',
    'system_alert',
    'kb_article_published',
  ].includes(type)
}

/**
 * Get notification icon name by type
 */
export function getNotificationIcon(type: NotificationType): string {
  return NOTIFICATION_TYPE_ICONS[type] || 'Bell'
}

/**
 * Get notification label by type
 */
export function getNotificationLabel(type: NotificationType): string {
  return NOTIFICATION_TYPE_LABELS[type] || 'Notification'
}

/**
 * Check if notification is unread
 */
export function isUnread(notification: Notification): boolean {
  return notification.read_at === null
}

/**
 * Check if notification is archived
 */
export function isArchived(notification: Notification): boolean {
  return notification.archived_at !== null
}

/**
 * Get notification link based on type
 */
export function getNotificationLink(notification: Notification): string | null {
  if (notification.ticket_id) {
    return `/tickets/${notification.ticket_id}`
  }
  if (notification.article_id) {
    return `/kb/${notification.article_id}`
  }
  return null
}
