/**
 * Database Types
 * 
 * Core PostgreSQL enum types and type aliases.
 * These match the database schema custom types.
 * 
 * Auto-generated types will be placed in database.types.ts after running:
 * npm run generate:types
 */

// ============================================================================
// PostgreSQL ENUM Types
// ============================================================================

export type UserRole = 'employee' | 'staff' | 'admin' | 'super_admin'

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'on_hold'
  | 'resolved'
  | 'closed'
  | 'canceled'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical'

export type ArticleStatus = 'draft' | 'published' | 'archived'

// ============================================================================
// Role Hierarchy Helpers
// ============================================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  employee: 0,
  staff: 1,
  admin: 2,
  super_admin: 3,
}

export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isStaffOrAbove(role: UserRole): boolean {
  return hasPermission(role, 'staff')
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin'
}

// ============================================================================
// Status and Priority Helpers
// ============================================================================

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Pending',
  in_progress: 'Ongoing',
  on_hold: 'On Hold',
  resolved: 'Resolved',
  closed: 'Closed',
  canceled: 'Cancelled',
}

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  critical: 'Critical',
}

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidUserRole(role: string): role is UserRole {
  return ['employee', 'staff', 'admin', 'super_admin'].includes(role)
}

export function isValidTicketStatus(status: string): status is TicketStatus {
  return [
    'open',
    'in_progress',
    'on_hold',
    'resolved',
    'closed',
    'canceled',
  ].includes(status)
}

export function isValidTicketPriority(
  priority: string
): priority is TicketPriority {
  return ['low', 'medium', 'high', 'urgent', 'critical'].includes(priority)
}

export function isValidArticleStatus(
  status: string
): status is ArticleStatus {
  return ['draft', 'published', 'archived'].includes(status)
}

