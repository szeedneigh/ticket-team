"use client"

import { useEffect, useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Ticket,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types/users'
import Link from 'next/link'

interface ActivityTabProps {
  user: User
}

interface ActivityItem {
  id: string
  type: 'ticket_created' | 'ticket_updated' | 'comment_posted' | 'kb_created' | 'kb_updated'
  title: string
  description: string
  timestamp: string
  link?: string
  metadata?: Record<string, unknown>
}

interface TicketStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  avgResolutionTime?: number
}

interface RecentTicket {
  id: string
  ticket_number: string
  title: string
  status: string
  created_at: string
}

function ActivityTabComponent({ user }: ActivityTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [activityTimeline, setActivityTimeline] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])

  const fetchActivityData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Fetch ticket statistics
      const [totalResult, openResult, resolvedResult, closedResult] = await Promise.all([
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['open', 'in_progress']),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'resolved'),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'closed'),
      ])

      setStats({
        totalTickets: totalResult.count || 0,
        openTickets: openResult.count || 0,
        resolvedTickets: resolvedResult.count || 0,
        closedTickets: closedResult.count || 0,
      })

      // Fetch recent tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, ticket_number, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentTickets(
        (ticketsData || []).map((ticket) => ({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          created_at: ticket.created_at,
        }))
      )

      // Fetch activity timeline from ticket_activities
      const { data: activityData } = await supabase
        .from('ticket_activities')
        .select(`
          id,
          ticket_id,
          action,
          created_at,
          tickets (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Transform activities to timeline items
      // Supabase nested selects return arrays, so we handle both cases
      type ActivityRow = {
        id: string
        action: string
        created_at: string
        tickets?: {
          id: string
          title?: string
        }[] | {
          id: string
          title?: string
        } | null
      }

      const timeline: ActivityItem[] = (activityData || []).map((activity) => {
        const row = activity as unknown as ActivityRow
        // Handle both array and object ticket response from Supabase
        const ticketData = Array.isArray(row.tickets) ? row.tickets[0] : row.tickets
        return {
          id: row.id,
          type: row.action.includes('created') ? 'ticket_created' : 'ticket_updated',
          title: ticketData?.title || 'Unknown',
          description: row.action,
          timestamp: row.created_at,
          link: ticketData ? `/tickets/${ticketData.id}` : undefined,
        }
      })

      setActivityTimeline(timeline)
    } catch (error) {
      console.error('Error fetching activity data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchActivityData()
  }, [fetchActivityData])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'ticket_created':
      case 'ticket_updated':
        return <Ticket className="h-5 w-5" />
      case 'comment_posted':
        return <MessageSquare className="h-5 w-5" />
      case 'kb_created':
      case 'kb_updated':
        return <FileText className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'resolved':
        return 'bg-green-500/10 text-green-700 border-green-200'
      case 'closed':
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-8 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading activity data...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-[var(--brand-primary)]/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[var(--brand-primary)]/10">
                  <Ticket className="h-6 w-6 text-[var(--brand-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold text-[var(--brand-primary)]">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <AlertCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.openTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-500">{stats.resolvedTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gray-500/10">
                  <Clock className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.closedTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--brand-primary)]" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityTimeline.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityTimeline.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          {item.link && (
                            <Link href={item.link}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[var(--brand-primary)]" />
                Recent Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link href={`/tickets/${ticket.id}`}>
                        <div className="p-3 rounded-lg border border-border hover:border-[var(--brand-primary)]/30 hover:bg-muted/50 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {ticket.ticket_number}
                                </Badge>
                                <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                                  {ticket.status}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm truncate group-hover:text-[var(--brand-primary)] transition-colors">
                                {ticket.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-[var(--brand-primary)] transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export const ActivityTab = memo(ActivityTabComponent)
