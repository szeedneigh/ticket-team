/**
 * Central color tokens for charts, semantic UI, and analytics.
 * Use these instead of hardcoded hex across the app.
 * Align with globals.css --status-* and --chart-* where theme-aware colors are needed.
 * All hex values are lowercase for consistency.
 */

import type { TicketPriority, TicketStatus, ArticleStatus, UserRole } from '@/lib/types/database'

// ============================================================================
// Types for Tailwind class-based color systems
// ============================================================================

export interface BadgeColorStyle {
  /** Combined classes for background, text, and border */
  className: string
}

export interface DotColorStyle {
  /** Background color class for the dot */
  dot: string
  /** Text color class */
  text: string
}

// ============================================================================
// Satisfaction rating (1–5 stars) – distinct color per star
// ============================================================================

export const SATISFACTION_RATING_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#ef4444',   // red – very dissatisfied
  2: '#f97316',   // orange – dissatisfied
  3: '#eab308',   // yellow – neutral
  4: '#22c55e',   // green – satisfied
  5: '#10b981',   // emerald – very satisfied
} as const

/** Get hex color for a satisfaction rating (1–5). Fallback for out-of-range. */
export function getSatisfactionRatingColor(rating: number): string {
  const r = Math.max(1, Math.min(5, Math.round(rating))) as 1 | 2 | 3 | 4 | 5
  return SATISFACTION_RATING_COLORS[r]
}

// ============================================================================
// Brand
// ============================================================================

export const BRAND = {
  primary: '#1f3463',   // navy – matches --brand-primary
  accent: '#2cafdd',   // cyan – matches --brand-accent
  /** Legacy primary blue used in charts/sidebar */
  chartPrimary: '#0693d2',
} as const

// ============================================================================
// Status (semantic: success, warning, danger, info, purple)
// ============================================================================

export const STATUS = {
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
} as const

// ============================================================================
// Chart palette – use for generic series (pie, bar, trend by index)
// ============================================================================

export const CHART_PALETTE: readonly string[] = [
  '#0693d2',   // primary blue
  '#10b981',   // emerald
  '#8b5cf6',   // violet
  '#f59e0b',   // amber
  '#ef4444',   // red
  '#06b6d4',   // cyan
  '#ec4899',   // pink
  '#84cc16',   // lime
  '#14b8a6',   // teal
  '#6366f1',   // indigo
]

/** Get chart color by index (wraps around palette). */
export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

// ============================================================================
// Priority (ticket priority: low → critical) - Hex values for charts
// ============================================================================

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280',      // gray – neutral, not urgent
  medium: '#f59e0b',   // amber – moderate attention
  high: '#f97316',     // orange – important
  urgent: '#ef4444',   // red – immediate attention
  critical: '#991b1b', // dark red – system-wide impact
} as const

/** Get hex for ticket priority. */
export function getPriorityHexColor(priority: string): string {
  return PRIORITY_COLORS[priority.toLowerCase()] ?? '#6b7280'
}

// ============================================================================
// Priority Badge Styles (Tailwind classes for UI components)
// ============================================================================

export const PRIORITY_BADGE_STYLES: Record<TicketPriority, BadgeColorStyle> = {
  low: {
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800',
  },
  medium: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  high: {
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
  },
  urgent: {
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  },
  critical: {
    className: 'bg-red-200 text-red-900 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
  },
} as const

/** Get Tailwind classes for priority badge. */
export function getPriorityBadgeStyle(priority: TicketPriority): string {
  return PRIORITY_BADGE_STYLES[priority]?.className ?? PRIORITY_BADGE_STYLES.low.className
}

// ============================================================================
// Status (ticket/workflow status) – Hex values for charts
// ============================================================================

export const TICKET_STATUS_HEX_COLORS: Record<TicketStatus, string> = {
  open: '#eab308',       // yellow
  in_progress: '#3b82f6', // blue
  on_hold: '#f97316',    // orange
  resolved: '#10b981',   // green
  closed: '#6b7280',     // gray
  canceled: '#ef4444',   // red
} as const

/** Get hex for ticket status. */
export function getStatusHexColor(status: TicketStatus): string {
  return TICKET_STATUS_HEX_COLORS[status] ?? '#6b7280'
}

// ============================================================================
// Status Badge Styles (Tailwind classes for badge components)
// ============================================================================

export const STATUS_BADGE_STYLES: Record<TicketStatus, BadgeColorStyle> = {
  open: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  in_progress: {
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  },
  on_hold: {
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
  },
  resolved: {
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
  },
  closed: {
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800',
  },
  canceled: {
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  },
} as const

/** Get Tailwind classes for status badge. */
export function getStatusBadgeStyle(status: TicketStatus): string {
  return STATUS_BADGE_STYLES[status]?.className ?? STATUS_BADGE_STYLES.open.className
}

// ============================================================================
// Status Dot/Cell Styles (for table cells with colored dots)
// ============================================================================

export const STATUS_DOT_COLORS: Record<TicketStatus, DotColorStyle> = {
  open: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  in_progress: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  on_hold: {
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
  },
  resolved: {
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  closed: {
    dot: 'bg-gray-600',
    text: 'text-gray-700 dark:text-gray-400',
  },
  canceled: {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
} as const

/** Get dot and text colors for status cell. */
export function getStatusDotColors(status: TicketStatus): DotColorStyle {
  return STATUS_DOT_COLORS[status] ?? STATUS_DOT_COLORS.open
}

// ============================================================================
// KB Article Status Styles
// ============================================================================

export const ARTICLE_STATUS_STYLES: Record<ArticleStatus, BadgeColorStyle> = {
  draft: {
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  published: {
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
  },
  archived: {
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800',
  },
} as const

/** Get Tailwind classes for article status badge. */
export function getArticleStatusStyle(status: ArticleStatus): string {
  return ARTICLE_STATUS_STYLES[status]?.className ?? ARTICLE_STATUS_STYLES.draft.className
}

// ============================================================================
// User Role Badge Styles
// ============================================================================

export const ROLE_BADGE_STYLES: Record<UserRole, BadgeColorStyle & { label: string }> = {
  employee: {
    label: 'Employee',
    className: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-700',
  },
  staff: {
    label: 'Staff',
    className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-700',
  },
  admin: {
    label: 'Admin',
    className: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-700',
  },
  super_admin: {
    label: 'Super Admin',
    className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-700',
  },
} as const

/** Get Tailwind classes for role badge. */
export function getRoleBadgeStyle(role: UserRole): string {
  return ROLE_BADGE_STYLES[role]?.className ?? ROLE_BADGE_STYLES.employee.className
}

/** Get display label for role. */
export function getRoleLabel(role: UserRole): string {
  return ROLE_BADGE_STYLES[role]?.label ?? 'Unknown'
}

// ============================================================================
// Satisfaction (stats card / dashboard) – accent for "Satisfaction" metric
// ============================================================================

export const SATISFACTION_ACCENT = {
  primary: '#6366f1',   // indigo – main satisfaction card
  trendUp: '#facc15',   // gold – trend up accent
} as const

// ============================================================================
// KB category names – for category distribution pie
// ============================================================================

export const KB_CATEGORY_COLORS: Record<string, string> = {
  Technical: STATUS.info,
  Account: STATUS.purple,
  Enrollment: STATUS.success,
  General: '#6b7280',
  Financial: STATUS.warning,
  Academic: STATUS.danger,
}

// Legacy exports for backward compatibility
export const TICKET_STATUS_COLORS: readonly string[] = [
  '#0693d2',   // open / primary
  '#8b5cf6',   // in progress
  '#10b981',   // resolved
  '#6b7280',   // closed / cancelled
]

/** Get color for status by index. */
export function getTicketStatusColor(index: number): string {
  return TICKET_STATUS_COLORS[index % TICKET_STATUS_COLORS.length]
}

// Legacy alias
export const getPriorityColor = getPriorityHexColor

