/**
 * ChatWidget Component
 *
 * Floating chat widget that provides quick access to Timi AI assistant:
 * - Floating button at bottom-right corner
 * - Opens dialog/drawer with full chat interface
 * - Responsive (drawer on mobile, dialog on desktop)
 * - Persists state across navigation
 * - Shows unread indicator
 *
 * @module components/chat/chat-widget
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Minus, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ChatClient } from './chat-client'
import { useChatWidget } from './chat-widget-context'
import { createChatSession, getUserChatSessions } from '@/app/actions/chat'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ChatWidgetProps {
  userName?: string
  userId?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChatWidget({ userName, userId }: ChatWidgetProps) {
  const {
    isOpen,
    isMinimized,
    activeSessionId,
    sessions,
    currentMessages,
    openWidget,
    closeWidget,
    minimizeWidget,
    maximizeWidget,
    setActiveSession,
    setSessions,
    setCurrentMessages,
  } = useChatWidget()

  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load sessions when widget opens for the first time
  useEffect(() => {
    if (isOpen && !activeSessionId && !isLoading) {
      initializeWidget()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Initialize widget: load sessions and create/select active session
  const initializeWidget = useCallback(async () => {
    if (!userId) {
      toast.error('Please sign in to use chat')
      closeWidget()
      return
    }

    setIsLoading(true)

    try {
      // Fetch user's sessions
      const result = await getUserChatSessions({ limit: 10 })

      if (!result.success) {
        toast.error(result.error || 'Failed to load chat sessions')
        return
      }

      const userSessions = result.data
      setSessions(userSessions)

      // If user has sessions, use the most recent one
      if (userSessions.length > 0) {
        const recentSession = userSessions[0]
        setActiveSession(recentSession.session_id)
      } else {
        // Create new session
        const newSessionResult = await createChatSession()

        if (!newSessionResult.success) {
          toast.error(newSessionResult.error || 'Failed to create chat session')
          return
        }

        setActiveSession(newSessionResult.data.sessionId)

        // Add to sessions list
        setSessions([{
          session_id: newSessionResult.data.sessionId,
          title: null,
          last_message: 'New conversation',
          last_message_at: new Date().toISOString(),
          message_count: 0,
          escalated: false,
        }])
      }
    } catch (error) {
      console.error('Failed to initialize widget:', error)
      toast.error('Failed to initialize chat')
    } finally {
      setIsLoading(false)
    }
  }, [userId, closeWidget, setSessions, setActiveSession])

  // Handle widget open
  const handleOpen = () => {
    openWidget()
    setHasUnread(false)
  }

  // Handle widget close
  const handleClose = () => {
    closeWidget()
  }

  // Handle minimize
  const handleMinimize = () => {
    minimizeWidget()
  }

  // Handle maximize
  const handleMaximize = () => {
    maximizeWidget()
  }

  // Handle open/close change from Dialog/Drawer
  const handleOpenChange = (open: boolean) => {
    if (open) {
      openWidget()
      setHasUnread(false)
    } else {
      closeWidget()
    }
  }

  // Chat content (used in both Dialog and Drawer)
  const chatContent = activeSessionId ? (
    <div className="flex h-full flex-col">
      <ChatClient
        key={activeSessionId}
        sessionId={activeSessionId}
        initialMessages={currentMessages}
        userName={userName}
        onMessagesChange={setCurrentMessages}
      />
    </div>
  ) : (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Image
          src="/assets/floating-timi.svg"
          alt="Timi Bot"
          width={48}
          height={48}
          className="mx-auto h-12 w-12 opacity-60"
        />
        <p className="mt-4 text-sm text-muted-foreground">
          {isLoading ? 'Loading chat...' : 'Initializing chat...'}
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={handleOpen}
        size="lg"
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full transition-all',
          'bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white',
          '[box-shadow:var(--elev-3)] hover:[box-shadow:var(--elev-3),0_6px_12px_rgb(0_0_0_/_0.12)]',
          'hover:scale-110 active:scale-95',
          '[transition:all_var(--duration-base)_var(--transition-timing)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2',
          isOpen && 'scale-0'
        )}
        aria-label="Open chat with Timi"
      >
        <Image
          src="/assets/floating-timi.svg"
          alt="Timi Bot"
          width={28}
          height={28}
          className="h-7 w-7"
        />

        {/* Unread indicator */}
        {hasUnread && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white [box-shadow:var(--elev-2)] animate-pulse">
            !
          </span>
        )}
      </Button>

      {/* Mobile: Drawer */}
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="border-b bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary)]/95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm [box-shadow:var(--elev-1)]">
                    <Image
                      src="/assets/floating-timi.svg"
                      alt="Timi Bot"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <DrawerTitle className="text-white">Chat with Timi</DrawerTitle>
                    <DrawerDescription className="text-white/80">Your AI IT support assistant</DrawerDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  aria-label="Close chat"
                  className="text-white hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden">
              {chatContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop: Dialog */
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            className={cn(
              'flex flex-col gap-0 p-0 [box-shadow:var(--elev-3)] border-0',
              isMinimized
                ? 'h-[60px] w-[300px]'
                : 'h-[600px] w-[450px] max-w-[90vw]'
            )}
          >
            {/* Header */}
            <DialogHeader className="shrink-0 border-b p-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary)]/95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm [box-shadow:var(--elev-1)]">
                    <Image
                      src="/assets/floating-timi.svg"
                      alt="Timi Bot"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-white">Chat with Timi</DialogTitle>
                    <DialogDescription className={cn('text-white/80', isMinimized && 'hidden')}>
                      Your AI IT support assistant
                    </DialogDescription>
                  </div>
                </div>

                {/* Window controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                    onClick={isMinimized ? handleMaximize : handleMinimize}
                    aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                    onClick={handleClose}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Chat Content */}
            {!isMinimized && (
              <div className="flex-1 overflow-hidden">
                {chatContent}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
