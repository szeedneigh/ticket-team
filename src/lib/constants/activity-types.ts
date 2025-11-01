/**
 * Ticket Activity Types
 * 
 * Standardized action type strings for logging to ticket_activities table.
 * These constants ensure consistent naming across all Server Actions that modify tickets.
 * 
 * Usage:
 * ```typescript
 * import { ACTIVITY_TYPES } from '@/lib/constants/activity-types'
 * 
 * await supabase.from('ticket_activities').insert({
 *   ticket_id: ticketId,
 *   user_id: userId,
 *   action: ACTIVITY_TYPES.STATUS_CHANGED,
 *   details: { from: 'open', to: 'in_progress' }
 * })
 * ```
 */

// ============================================================================
// Activity Type Constants
// ============================================================================

export const ACTIVITY_TYPES = {
  // Ticket Creation & Lifecycle
  TICKET_CREATED: 'ticket_created',
  TICKET_UPDATED: 'ticket_updated',
  TICKET_REOPENED: 'ticket_reopened',
  
  // Status Changes
  STATUS_CHANGED: 'status_changed',
  
  // Assignment
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_UNASSIGNED: 'ticket_unassigned',
  ASSIGNMENT_CHANGED: 'assignment_changed',
  
  // Priority Changes
  PRIORITY_CHANGED: 'priority_changed',
  
  // Category Changes
  CATEGORY_CHANGED: 'category_changed',
  
  // Comments
  COMMENT_ADDED: 'comment_added',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',
  INTERNAL_NOTE_ADDED: 'internal_note_added',
  
  // Attachments
  ATTACHMENT_ADDED: 'attachment_added',
  ATTACHMENT_REMOVED: 'attachment_removed',
  
  // Resolution
  RESOLUTION_ADDED: 'resolution_added',
  RESOLUTION_UPDATED: 'resolution_updated',
  
  // Feedback
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  
  // Knowledge Base Integration
  KB_ARTICLE_LINKED: 'kb_article_linked',
  KB_ARTICLE_CREATED: 'kb_article_created_from_ticket',
  
  // AI Integration (Future)
  AI_ESCALATION: 'ai_escalation',
  AI_SUGGESTION_APPLIED: 'ai_suggestion_applied',
} as const

// Type for activity type values
export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]

// ============================================================================
// Aliases to match DB triggers and legacy/documented names
// ----------------------------------------------------------------------------
// Some actions are produced by PostgreSQL triggers (cannot import TS constants)
// or appear in older docs. Normalize them in app code using this map if needed.
// ============================================================================

export const ACTIVITY_ALIASES: Record<string, ActivityType> = {
  // DB trigger values
  created: ACTIVITY_TYPES.TICKET_CREATED,
  assigned: ACTIVITY_TYPES.TICKET_ASSIGNED,
  status_changed: ACTIVITY_TYPES.STATUS_CHANGED,
  priority_changed: ACTIVITY_TYPES.PRIORITY_CHANGED,

  // Documented variants
  reopened: ACTIVITY_TYPES.TICKET_REOPENED,
  priority_updated: ACTIVITY_TYPES.PRIORITY_CHANGED,
}

// ============================================================================
// Activity Type Labels (for UI display)
// ============================================================================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ACTIVITY_TYPES.TICKET_CREATED]: 'Ticket Created',
  [ACTIVITY_TYPES.TICKET_UPDATED]: 'Ticket Updated',
  [ACTIVITY_TYPES.TICKET_REOPENED]: 'Ticket Reopened',
  [ACTIVITY_TYPES.STATUS_CHANGED]: 'Status Changed',
  [ACTIVITY_TYPES.TICKET_ASSIGNED]: 'Ticket Assigned',
  [ACTIVITY_TYPES.TICKET_UNASSIGNED]: 'Ticket Unassigned',
  [ACTIVITY_TYPES.ASSIGNMENT_CHANGED]: 'Assignment Changed',
  [ACTIVITY_TYPES.PRIORITY_CHANGED]: 'Priority Changed',
  [ACTIVITY_TYPES.CATEGORY_CHANGED]: 'Category Changed',
  [ACTIVITY_TYPES.COMMENT_ADDED]: 'Comment Added',
  [ACTIVITY_TYPES.COMMENT_UPDATED]: 'Comment Updated',
  [ACTIVITY_TYPES.COMMENT_DELETED]: 'Comment Deleted',
  [ACTIVITY_TYPES.INTERNAL_NOTE_ADDED]: 'Internal Note Added',
  [ACTIVITY_TYPES.ATTACHMENT_ADDED]: 'Attachment Added',
  [ACTIVITY_TYPES.ATTACHMENT_REMOVED]: 'Attachment Removed',
  [ACTIVITY_TYPES.RESOLUTION_ADDED]: 'Resolution Added',
  [ACTIVITY_TYPES.RESOLUTION_UPDATED]: 'Resolution Updated',
  [ACTIVITY_TYPES.FEEDBACK_SUBMITTED]: 'Feedback Submitted',
  [ACTIVITY_TYPES.KB_ARTICLE_LINKED]: 'Knowledge Base Article Linked',
  [ACTIVITY_TYPES.KB_ARTICLE_CREATED]: 'Knowledge Base Article Created',
  [ACTIVITY_TYPES.AI_ESCALATION]: 'Escalated from AI Chat',
  [ACTIVITY_TYPES.AI_SUGGESTION_APPLIED]: 'AI Suggestion Applied',
}

// ============================================================================
// Activity Type Descriptions (for tooltips/help text)
// ============================================================================

export const ACTIVITY_TYPE_DESCRIPTIONS: Record<ActivityType, string> = {
  [ACTIVITY_TYPES.TICKET_CREATED]: 'A new ticket was created',
  [ACTIVITY_TYPES.TICKET_UPDATED]: 'Ticket details were updated',
  [ACTIVITY_TYPES.TICKET_REOPENED]: 'A closed or resolved ticket was reopened',
  [ACTIVITY_TYPES.STATUS_CHANGED]: 'Ticket status was changed',
  [ACTIVITY_TYPES.TICKET_ASSIGNED]: 'Ticket was assigned to a staff member',
  [ACTIVITY_TYPES.TICKET_UNASSIGNED]: 'Ticket assignment was removed',
  [ACTIVITY_TYPES.ASSIGNMENT_CHANGED]: 'Ticket was reassigned to a different staff member',
  [ACTIVITY_TYPES.PRIORITY_CHANGED]: 'Ticket priority was changed',
  [ACTIVITY_TYPES.CATEGORY_CHANGED]: 'Ticket category or subcategory was changed',
  [ACTIVITY_TYPES.COMMENT_ADDED]: 'A new comment was added',
  [ACTIVITY_TYPES.COMMENT_UPDATED]: 'A comment was edited',
  [ACTIVITY_TYPES.COMMENT_DELETED]: 'A comment was deleted',
  [ACTIVITY_TYPES.INTERNAL_NOTE_ADDED]: 'An internal staff note was added',
  [ACTIVITY_TYPES.ATTACHMENT_ADDED]: 'A file was attached',
  [ACTIVITY_TYPES.ATTACHMENT_REMOVED]: 'An attachment was removed',
  [ACTIVITY_TYPES.RESOLUTION_ADDED]: 'Resolution notes were added',
  [ACTIVITY_TYPES.RESOLUTION_UPDATED]: 'Resolution notes were updated',
  [ACTIVITY_TYPES.FEEDBACK_SUBMITTED]: 'User submitted feedback for this ticket',
  [ACTIVITY_TYPES.KB_ARTICLE_LINKED]: 'A knowledge base article was linked',
  [ACTIVITY_TYPES.KB_ARTICLE_CREATED]: 'A knowledge base article was created from this ticket',
  [ACTIVITY_TYPES.AI_ESCALATION]: 'Ticket was created from AI chatbot escalation',
  [ACTIVITY_TYPES.AI_SUGGESTION_APPLIED]: 'An AI-suggested solution was applied',
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a string is a valid activity type
 */
export function isValidActivityType(type: string): type is ActivityType {
  return Object.values(ACTIVITY_TYPES).includes(type as ActivityType)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the display label for an activity type
 */
export function getActivityTypeLabel(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type] || type
}

/**
 * Get the description for an activity type
 */
export function getActivityTypeDescription(type: ActivityType): string {
  return ACTIVITY_TYPE_DESCRIPTIONS[type] || ''
}

/**
 * Normalize an incoming action string (e.g., from DB triggers) to a canonical ActivityType
 */
export function normalizeActivityType(action: string): ActivityType | undefined {
  if (isValidActivityType(action)) return action
  const mapped = ACTIVITY_ALIASES[action]
  return mapped
}

/**
 * Format activity details for display
 * 
 * @param action - The activity type
 * @param details - The JSONB details object from ticket_activities
 * @returns Formatted string for display
 */
export function formatActivityDetails(
  action: ActivityType,
  details: Record<string, unknown>
): string {
  switch (action) {
    case ACTIVITY_TYPES.STATUS_CHANGED:
      return `from "${details.from}" to "${details.to}"`
    
    case ACTIVITY_TYPES.PRIORITY_CHANGED:
      return `from "${details.from}" to "${details.to}"`
    
    case ACTIVITY_TYPES.TICKET_ASSIGNED:
      return `to ${details.assigned_to_name || 'staff member'}`
    
    case ACTIVITY_TYPES.ASSIGNMENT_CHANGED:
      return `from ${details.from_name || 'previous staff'} to ${details.to_name || 'new staff'}`
    
    case ACTIVITY_TYPES.CATEGORY_CHANGED:
      return `from "${details.from}" to "${details.to}"`
    
    case ACTIVITY_TYPES.ATTACHMENT_ADDED:
      return `"${details.filename || 'file'}"`
    
    case ACTIVITY_TYPES.ATTACHMENT_REMOVED:
      return `"${details.filename || 'file'}"`
    
    case ACTIVITY_TYPES.TICKET_REOPENED:
      return details.reason ? `Reason: ${details.reason}` : ''
    
    case ACTIVITY_TYPES.KB_ARTICLE_LINKED:
      return `"${details.article_title || 'article'}"`
    
    case ACTIVITY_TYPES.FEEDBACK_SUBMITTED:
      return `Rating: ${details.rating}/5`
    
    default:
      return ''
  }
}

