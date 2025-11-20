/**
 * Notification Queries
 *
 * Database queries for fetching and managing notifications.
 *
 * @module lib/notifications/queries
 */

import { createClient } from '@/lib/supabase/server'
import type {
  NotificationWithActor,
  NotificationFilters,
  NotificationsResponse,
} from '@/lib/types/notifications'

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<NotificationsResponse> {
  const supabase = await createClient()

  const {
    type,
    read,
    archived = false,
    page = 1,
    per_page = 20,
  } = filters

  // Build query
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
    `, { count: 'exact' })

  // Apply filters
  if (type) {
    if (Array.isArray(type)) {
      query = query.in('type', type)
    } else {
      query = query.eq('type', type)
    }
  }

  if (read !== undefined) {
    if (read) {
      query = query.not('read_at', 'is', null)
    } else {
      query = query.is('read_at', null)
    }
  }

  if (archived) {
    query = query.not('archived_at', 'is', null)
  } else {
    query = query.is('archived_at', null)
  }

  // Apply pagination
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .is('read_at', null)
    .is('archived_at', null)

  const total = count || 0
  const totalPages = Math.ceil(total / per_page)

  return {
    notifications: (data || []) as NotificationWithActor[],
    pagination: {
      page,
      per_page,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
    unread_count: unreadCount || 0,
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_unread_notification_count')

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return data || 0
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('mark_notification_read', {
      p_notification_id: notificationId,
    })

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return data || false
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('mark_all_notifications_read')

  if (error) {
    console.error('Error marking all as read:', error)
    return 0
  }

  return data || 0
}

/**
 * Archive a notification
 */
export async function archiveNotification(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('Error archiving notification:', error)
    return false
  }

  return true
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    return false
  }

  return true
}
