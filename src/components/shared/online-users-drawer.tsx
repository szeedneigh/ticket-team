/**
 * Online Users Drawer Component
 *
 * Displays a list of currently online users in a right-side drawer.
 * Uses real-time presence tracking via Supabase Realtime.
 * Opens via a floating action button.
 *
 * @module components/shared/online-users-drawer
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useUserPresence } from '@/lib/hooks/use-user-presence'
import { Users } from 'lucide-react'

export function OnlineUsersDrawer() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div
          className="fixed top-20 right-8 z-40"
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.2
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            className="h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-[#1f3463] to-[#2cafdd] hover:from-[#1f3463]/90 hover:to-[#2cafdd]/90 text-white group"
          >
            <Users className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Who&apos;s Online</span>
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/20 text-white hover:bg-white/30 border-0"
            >
              {onlineUsers.length}
            </Badge>
          </Button>
        </motion.div>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-xl border-l border-border/50"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-[#2cafdd]" />
              Who&apos;s Online
            </SheetTitle>
            <SheetDescription>
              {onlineUsers.length} {onlineUsers.length === 1 ? 'person is' : 'people are'} currently online
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-4">
            <div className="space-y-4">
              {onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-background/40 hover:bg-background/60 hover:scale-[1.01] transition-all duration-200"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-[#2cafdd]/20">
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1f3463] to-[#2cafdd] text-white font-semibold">
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span 
                      className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background animate-pulse" 
                      aria-label="Online"
                    />
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-base truncate">
                      {user.fullName}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs capitalize border-[#2cafdd]/30 text-[#2cafdd]"
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
