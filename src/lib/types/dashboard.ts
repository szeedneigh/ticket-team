/**
 * Dashboard Types
 * 
 * Type definitions for dashboard-related data structures and interfaces.
 * 
 * @module lib/types/dashboard
 */

export interface DashboardStats {
  openTickets: number
  resolvedTickets: number
  avgResponseTime: string
  satisfaction: number
  totalTickets: number
  myTickets: number
  assignedTickets: number
  overdueTickets: number
}

export interface Activity {
  id: string
  type: ActivityType
  description: string
  timestamp: Date
  userId: string
  userName: string
  metadata?: Record<string, unknown>
}

export type ActivityType = 
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_assigned'
  | 'ticket_resolved'
  | 'comment_added'
  | 'status_changed'
  | 'priority_changed'
  | 'kb_article_created'
  | 'kb_article_updated'
  | 'user_registered'
  | 'user_updated'

export interface DashboardActivityItem {
  id: string
  type: 'ticket_created' | 'comment_added' | 'status_changed'
  title: string
  description?: string
  ticketId: string
  actorId: string
  createdAt: string
  meta?: Record<string, unknown>
}

export interface TicketSummary {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  overdue: number
}

export interface UserTicketSummary extends TicketSummary {
  myTickets: number
  assignedToMe: number
}

export interface KBStats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  mostViewed: Array<{
    id: string
    title: string
    views: number
  }>
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: Activity[]
  ticketSummary: UserTicketSummary
  kbStats?: KBStats
}

export interface DashboardFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  ticketStatus?: string[]
  priority?: string[]
  department?: string[]
}

export interface DashboardPreferences {
  showWelcomeBanner: boolean
  defaultView: 'grid' | 'list'
  itemsPerPage: number
  refreshInterval: number
}
