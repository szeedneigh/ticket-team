/**
 * Audit Log Types
 *
 * Type definitions for ticket activity audit logs
 *
 * @module lib/types/audit
 */

// ============================================================================
// Database Types
// ============================================================================

// Activity types from database enum
export type ActivityType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'reassigned'
  | 'unassigned'
  | 'commented'
  | 'comment_edited'
  | 'comment_deleted'
  | 'attachment_added'
  | 'attachment_removed'
  | 'category_changed'
  | 'tags_changed'
  | 'title_changed'
  | 'description_changed'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'archived'

// ============================================================================
// Query Types
// ============================================================================

/**
 * Audit log entry with user information
 */
export interface AuditLogEntry {
  id: string
  ticket_id: string
  activity_type: ActivityType
  performed_by: string | null
  performed_at: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  comment: string | null
  metadata: Record<string, unknown> | null
  // Joined user data
  user: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  // Joined ticket data
  ticket: {
    id: string
    title: string
    display_number?: string
  } | null
}

/**
 * Audit log filters for querying
 */
export interface AuditLogFilters {
  /** Filter by date range start */
  startDate?: string
  /** Filter by date range end */
  endDate?: string
  /** Filter by user ID */
  userId?: string
  /** Filter by activity type */
  activityType?: ActivityType | ActivityType[]
  /** Filter by ticket ID */
  ticketId?: string
  /** Search in field name, old value, new value, or comment */
  search?: string
}

/**
 * Pagination parameters for audit logs
 */
export interface AuditLogPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

/**
 * Audit log query result
 */
export interface AuditLogResult {
  logs: AuditLogEntry[]
  pagination: AuditLogPagination
}

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  /** Total activity count */
  totalActivities: number
  /** Number of unique users who performed activities */
  uniqueUsers: number
  /** Date of earliest activity */
  earliestActivity: string | null
  /** Date of latest activity */
  latestActivity: string | null
  /** Activity type breakdown */
  activityBreakdown: {
    type: ActivityType
    count: number
  }[]
  /** Top 5 most active users */
  topUsers: {
    userId: string
    userName: string
    userEmail: string
    activityCount: number
  }[]
}

/**
 * CSV export row
 */
export interface AuditLogCSVRow {
  Date: string
  Time: string
  User: string
  Email: string
  'Ticket Number': string
  'Ticket Title': string
  Action: string
  Field: string
  'Old Value': string
  'New Value': string
  Comment: string
}

// ============================================================================
// Activity Type Labels (Human-Readable)
// ============================================================================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  created: 'Ticket Created',
  status_changed: 'Status Changed',
  priority_changed: 'Priority Changed',
  assigned: 'Assigned',
  reassigned: 'Reassigned',
  unassigned: 'Unassigned',
  commented: 'Comment Added',
  comment_edited: 'Comment Edited',
  comment_deleted: 'Comment Deleted',
  attachment_added: 'Attachment Added',
  attachment_removed: 'Attachment Removed',
  category_changed: 'Category Changed',
  tags_changed: 'Tags Changed',
  title_changed: 'Title Changed',
  description_changed: 'Description Changed',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
  archived: 'Archived',
}

/**
 * Get human-readable label for activity type
 */
export function getActivityTypeLabel(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type] || type
}

/**
 * Check if activity type is a major change (worth highlighting)
 */
export function isMajorActivity(type: ActivityType): boolean {
  return [
    'created',
    'status_changed',
    'priority_changed',
    'assigned',
    'reassigned',
    'resolved',
    'closed',
    'reopened',
  ].includes(type)
}

// ============================================================================
// Sort Options
// ============================================================================

export type AuditLogSortField = 'performed_at' | 'activity_type' | 'ticket_id' | 'performed_by'
export type AuditLogSortOrder = 'asc' | 'desc'

export interface AuditLogSort {
  field: AuditLogSortField
  order: AuditLogSortOrder
}

