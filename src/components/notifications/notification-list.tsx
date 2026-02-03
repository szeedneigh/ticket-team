/**
 * Notification List Component
 *
 * Displays a list of notifications with filtering and actions.
 */

'use client'

import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Filter,
  MessageSquare,
  UserPlus,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  AtSign,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type {
  NotificationWithActor,
  NotificationType,
} from '@/lib/types/notifications'
import { getNotificationLink, getNotificationLabel } from '@/lib/types/notifications'

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  ticket_assigned: UserPlus,
  ticket_comment: MessageSquare,
  ticket_resolved: CheckCircle,
  ticket_status_changed: RefreshCw,
  ticket_priority_changed: AlertTriangle,
  mention: AtSign,
  system_alert: AlertCircle,
  kb_article_published: BookOpen,
}

interface NotificationListProps {
  initialNotifications: NotificationWithActor[]
  initialPagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  initialUnreadCount: number
}

export const NotificationList = memo(function NotificationList({
  initialNotifications,
  initialUnreadCount,
}: NotificationListProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Refresh notifications - useCallback for stable reference
  // Takes optional filterOverride to avoid stale closure issues
  const refreshNotifications = useCallback(async (filterOverride?: 'all' | 'unread') => {
    setIsLoading(true)
    const supabase = createClient()
    const currentFilter = filterOverride ?? filter

    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:users!notifications_actor_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (currentFilter === 'unread') {
      query = query.is('read_at', null)
    }

    const { data } = await query
    setNotifications(data || [])

    // Update unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null)
      .is('archived_at', null)

    setUnreadCount(count || 0)
    setIsLoading(false)
  }, [filter])

  // Mark as read - useCallback for stable reference
  const handleMarkAsRead = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    refreshNotifications()
  }, [refreshNotifications])

  // Mark all as read - useCallback for stable reference
  const handleMarkAllAsRead = useCallback(async () => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)

    // Always refresh with 'all' filter after marking all as read to avoid empty state
    refreshNotifications('all')
    // Update the filter state to 'all' as well
    setFilter('all')
  }, [refreshNotifications])

  // Archive notification - useCallback for stable reference
  const handleArchive = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)

    refreshNotifications()
  }, [refreshNotifications])

  // Delete notification - useCallback for stable reference
  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)

    refreshNotifications()
  }, [refreshNotifications])

  // Navigate to notification link - useCallback for stable reference
  const handleClick = useCallback((notification: NotificationWithActor) => {
    const link = getNotificationLink(notification)
    if (link) {
      if (!notification.read_at) {
        handleMarkAsRead(notification.id)
      }
      router.push(link)
    }
  }, [router, handleMarkAsRead])

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          refreshNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshNotifications])

  // Filter change - useCallback for stable reference
  const handleFilterChange = useCallback((value: string) => {
    const newFilter = value as 'all' | 'unread'
    setFilter(newFilter)
    setTimeout(() => refreshNotifications(newFilter), 0)
  }, [refreshNotifications])

  // Memoize filtered notifications to avoid re-filtering on every render
  const filteredNotifications = useMemo(() =>
    filter === 'unread'
      ? notifications.filter((n) => !n.read_at)
      : notifications
  , [filter, notifications])

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Notifications will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell
            const link = getNotificationLink(notification)

            return (
              <Card
                key={notification.id}
                className={cn(
                  'transition-colors',
                  !notification.read_at && 'bg-muted/50 border-primary/20',
                  link && 'cursor-pointer hover:bg-muted'
                )}
                onClick={() => link && handleClick(notification)}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      !notification.read_at
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <Badge variant="default" className="shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>{getNotificationLabel(notification.type)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Filter className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {!notification.read_at && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchive(notification.id)
                        }}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
})
