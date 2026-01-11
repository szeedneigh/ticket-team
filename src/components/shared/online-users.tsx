/**
 * Online Users Component
 *
 * Displays a list of currently online users at the bottom of the ticket management page.
 * Uses real-time presence tracking via Supabase Realtime.
 *
 * @module components/shared/online-users
 */

'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUserPresence } from '@/lib/hooks/use-user-presence'
import { Users } from 'lucide-react'

export function OnlineUsers() {
  const [mounted, setMounted] = useState(false)
  const { onlineUsers } = useUserPresence()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted (prevents SSR/hydration issues)
  if (!mounted) {
    return null
  }

  // Don't render if no users online (or only current user)
  if (onlineUsers.length === 0) {
    return null
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Who&apos;s Online</h3>
          <Badge variant="secondary" className="ml-auto">
            {onlineUsers.length}
          </Badge>
        </div>

        <ScrollArea className="h-32">
          <div className="flex flex-wrap gap-3">
            {onlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-2 text-sm"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback>
                      {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
}
