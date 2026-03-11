/**
 * User Activity History Component
 *
 * Displays comprehensive activity history for a user including:
 * - Ticket activities (status changes, assignments, etc.)
 * - Comments made
 * - KB articles created/edited
 * - Tickets created/assigned
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  MessageSquare,
  BookOpen,
  Ticket,
  Clock,
  ArrowUpRight,
  Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  ARTICLE_STATUS_LABELS,
  isValidTicketStatus,
  isValidTicketPriority,
  isValidArticleStatus,
  type TicketStatus,
  type TicketPriority,
  type ArticleStatus,
} from '@/lib/types/database'
import {
  getStatusBadgeStyle,
  getPriorityBadgeStyle,
  getArticleStatusStyle,
} from '@/lib/constants/colors'

interface TicketActivity {
  id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
  ticket: { id: string; title: string; status: string }
}

interface Comment {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  ticket: { id: string; title: string; status: string }
}

interface KBArticle {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  is_author: boolean
}

interface UserTicket {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  resolved_at: string | null
  relationship: 'created' | 'assigned'
}

interface UserActivityHistoryProps {
  ticketActivities: TicketActivity[]
  comments: Comment[]
  kbArticles: KBArticle[]
  tickets: UserTicket[]
}

export function UserActivityHistory({
  ticketActivities,
  comments,
  kbArticles,
  tickets,
}: UserActivityHistoryProps) {
  const [activeTab, setActiveTab] = useState('activities')

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  /** Get color classes for ticket status badge */
  const getStatusColor = (status: string) => {
    if (isValidTicketStatus(status)) {
      return getStatusBadgeStyle(status as TicketStatus)
    }
    // Handle KB article statuses
    if (isValidArticleStatus(status)) {
      return getArticleStatusStyle(status as ArticleStatus)
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
  }

  const getStatusLabel = (status: string) => {
    if (isValidTicketStatus(status)) return TICKET_STATUS_LABELS[status]
    if (isValidArticleStatus(status)) return ARTICLE_STATUS_LABELS[status]
    return status.replace(/_/g, ' ')
  }

  const getPriorityLabel = (priority: string) =>
    isValidTicketPriority(priority) ? TICKET_PRIORITY_LABELS[priority] : priority

  /** Get color classes for priority badge */
  const getPriorityColor = (priority: string) => {
    if (isValidTicketPriority(priority)) {
      return getPriorityBadgeStyle(priority as TicketPriority)
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="activities" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span className="hidden sm:inline">Activities</span>
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {ticketActivities.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="comments" className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span className="hidden sm:inline">Comments</span>
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {comments.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="tickets" className="flex items-center gap-1">
          <Ticket className="h-3 w-3" />
          <span className="hidden sm:inline">Tickets</span>
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {tickets.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="articles" className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          <span className="hidden sm:inline">Articles</span>
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {kbArticles.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* Ticket Activities */}
      <TabsContent value="activities" className="mt-4">
        <ScrollArea className="h-[400px]">
          {ticketActivities.length === 0 ? (
            <Empty className="border-0 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Activity className="size-5" /></EmptyMedia>
                <EmptyTitle>No recent activities</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3 pr-4">
              {ticketActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <Link
                        href={`/tickets/${activity.ticket.id}`}
                        className="group mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <span className="truncate">{activity.ticket.title}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      {activity.old_value && activity.new_value && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="line-through">{activity.old_value}</span>
                          {' → '}
                          <span className="font-medium">{activity.new_value}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatShortDate(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      {/* Comments */}
      <TabsContent value="comments" className="mt-4">
        <ScrollArea className="h-[400px]">
          {comments.length === 0 ? (
            <Empty className="border-0 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><MessageSquare className="size-5" /></EmptyMedia>
                <EmptyTitle>No comments made</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3 pr-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tickets/${comment.ticket.id}`}
                          className="group flex items-center gap-1 text-sm font-medium hover:text-primary"
                        >
                          <span className="truncate">{comment.ticket.title}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        {comment.is_internal && (
                          <Badge variant="outline" className="h-5 gap-1 px-1.5 text-xs">
                            <Lock className="h-2.5 w-2.5" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatShortDate(comment.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      {/* Tickets */}
      <TabsContent value="tickets" className="mt-4">
        <ScrollArea className="h-[400px]">
          {tickets.length === 0 ? (
            <Empty className="border-0 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Ticket className="size-5" /></EmptyMedia>
                <EmptyTitle>No tickets found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3 pr-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="group flex items-center gap-1 text-sm font-medium hover:text-primary"
                      >
                        <span className="truncate">{ticket.title}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`h-5 px-1.5 text-xs ${getStatusColor(ticket.status)}`}
                        >
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`h-5 px-1.5 text-xs ${getPriorityColor(ticket.priority)}`}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs capitalize">
                          {ticket.relationship}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatShortDate(ticket.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      {/* KB Articles */}
      <TabsContent value="articles" className="mt-4">
        <ScrollArea className="h-[400px]">
          {kbArticles.length === 0 ? (
            <Empty className="border-0 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><BookOpen className="size-5" /></EmptyMedia>
                <EmptyTitle>No articles found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3 pr-4">
              {kbArticles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/knowledge-base/${article.id}`}
                        className="group flex items-center gap-1 text-sm font-medium hover:text-primary"
                      >
                        <span className="truncate">{article.title}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`h-5 px-1.5 text-xs ${getStatusColor(article.status)}`}
                        >
                          {article.status}
                        </Badge>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {article.is_author ? 'Author' : 'Editor'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatShortDate(
                        article.is_author ? article.created_at : article.updated_at
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
