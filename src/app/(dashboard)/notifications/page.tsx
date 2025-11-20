/**
 * Notifications Page
 *
 * Full notification center with filtering and management.
 */

import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import { getNotifications } from '@/lib/notifications/queries'
import { NotificationList } from '@/components/notifications/notification-list'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Notifications | Ticket Team',
  description: 'View and manage your notifications',
}

async function NotificationsContent() {
  const response = await getNotifications({ per_page: 50 })

  return (
    <NotificationList
      initialNotifications={response.notifications}
      initialPagination={response.pagination}
      initialUnreadCount={response.unread_count}
    />
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on your tickets and activities
            </p>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent />
      </Suspense>
    </div>
  )
}
