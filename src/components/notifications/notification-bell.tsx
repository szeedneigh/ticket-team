/**
 * Notification Bell Component
 *
 * Shows notification count and dropdown with recent notifications.
 * Used in the navbar.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { NotificationWithActor } from '@/lib/types/notifications'
import { getNotificationLink } from '@/lib/types/notifications'

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    const supabase = createClient()

    // Get recent notifications
    const { data: notifs, error } = await supabase
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
      .limit(10)

    if (error) {
      console.error('Error fetching notifications:', error)
      return
    }

    setNotifications(notifs || [])

    // Get unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null)
      .is('archived_at', null)

    setUnreadCount(count || 0)
    setIsLoading(false)
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const supabase = createClient()

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    fetchNotifications()
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const supabase = createClient()

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)

    fetchNotifications()
  }

  // Navigate to notification
  const handleNotificationClick = (notification: NotificationWithActor) => {
    const link = getNotificationLink(notification)
    if (link) {
      // Mark as read when clicking
      if (!notification.read_at) {
        const supabase = createClient()
        supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notification.id)
          .then(() => fetchNotifications())
      }
      setIsOpen(false)
      router.push(link)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {unreadCount} unread notifications
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 cursor-pointer',
                  !notification.read_at && 'bg-muted/50'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="font-medium text-sm">
                    {notification.title}
                  </span>
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                    >
                      <Check className="h-3 w-3" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm"
          onClick={() => {
            setIsOpen(false)
            router.push('/notifications')
          }}
        >
          View all notifications
          <ExternalLink className="ml-2 h-3 w-3" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
