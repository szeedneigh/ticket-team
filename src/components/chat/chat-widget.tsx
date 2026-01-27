'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Minus, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ChatWidgetContent } from './chat-widget-content'
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
  const [isHovered, setIsHovered] = useState(false)
  const [showAltImage, setShowAltImage] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Alternate between two Timi images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowAltImage((prev) => !prev)
    }, 5000)

    return () => clearInterval(interval)
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
    if (isMinimized) maximizeWidget()
    setHasUnread(false)
  }

  // Handle widget close
  const handleClose = () => {
    closeWidget()
    // Reset minimized state when fully closed
    maximizeWidget()
  }

  // Chat content - Widget-specific compact component
  const chatContent = activeSessionId ? (
    <ChatWidgetContent
      key={activeSessionId}
      sessionId={activeSessionId}
      initialMessages={currentMessages}
      userName={userName}
      onMessagesChange={setCurrentMessages}
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center bg-white p-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-4 h-24 w-24"
      >
        <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100 opacity-50 blur-xl" />
        <Image
          src="/assets/floating-timi.svg"
          alt="Timi Bot"
          fill
          className="object-contain"
        />
      </motion.div>
      <p className="text-base font-medium text-[var(--brand-primary)]">
        {isLoading ? 'Connecting to Timi...' : 'Initializing...'}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Preparing your support session
      </p>
    </div>
  )

  // Desktop Header - Widget-specific style
  const DesktopHeader = () => (
    <div 
      className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3 text-white shadow-lg"
      style={{ 
        background: 'linear-gradient(135deg, #1f3463 0%, #2cafdd 100%)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 shadow-md">
          <Image
            src="/assets/floating-timi.svg"
            alt="Timi Bot"
            width={24}
            height={24}
            className="h-6 w-6 object-contain drop-shadow-lg"
          />
          {/* Animated status dot with pulsing ring */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" style={{ animationDuration: '2s' }} />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white shadow-sm animate-pulse" />
          </span>
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-bold leading-tight tracking-tight">Quick Chat</h3>
          <span className="text-xs text-white/80 font-medium">Timi AI Assistant</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={minimizeWidget}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-95"
          aria-label="Minimize chat"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-95"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {/* Launcher Button (Only visible when closed or minimized on desktop) */}
        {(!isOpen || (isMinimized && !isMobile)) && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            {/* Tooltip Bubble */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.9 }}
                  className="mr-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[var(--brand-primary)] shadow-lg ring-1 ring-black/5"
                >
                  Chat with Timi
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleOpen}
              className={cn(
                "group relative flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-[var(--brand-accent)]/40",
                isMinimized 
                  ? "bg-white ring-2 ring-[var(--brand-primary)]" 
                  : "bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)]"
              )}
              whileHover={{
                scale: [1, 1.1, 0.95, 1.05, 1],
                rotate: [0, -5, 5, -3, 0],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
              aria-label="Open chat"
            >
              {/* Subtle Moving Glowing Halo Effect */}
              {!isMinimized && (
                <>
                  {/* Rotating gradient glow - creates circular motion */}
                  <motion.span
                    className="absolute inset-0 rounded-full blur-xl"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0%, var(--brand-accent) 25%, var(--brand-primary) 50%, var(--brand-accent) 75%, transparent 100%)',
                      zIndex: -1,
                    }}
                    animate={{
                      rotate: [0, 360],
                      scale: [1.4, 1.6, 1.4],
                      opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                      rotate: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                      },
                      scale: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      opacity: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                  {/* Counter-rotating secondary glow for depth */}
                  <motion.span
                    className="absolute inset-0 rounded-full blur-2xl"
                    style={{
                      background: 'conic-gradient(from 180deg, transparent 0%, var(--brand-primary) 30%, var(--brand-accent) 60%, transparent 100%)',
                      zIndex: -2,
                    }}
                    animate={{
                      rotate: [360, 0],
                      scale: [1.6, 1.9, 1.6],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      rotate: {
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear"
                      },
                      scale: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      opacity: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                  {/* Ambient base glow */}
                  <motion.span
                    className="absolute inset-0 rounded-full bg-[var(--brand-accent)] blur-xl"
                    animate={{
                      scale: [1.3, 1.5, 1.3],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ zIndex: -3 }}
                  />
                  {/* Subtle pulsing ring */}
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[var(--brand-accent)] opacity-15" style={{ animationDuration: '2s' }} />
                </>
              )}

              {/* Animated Timi Image - Alternates every 5 seconds - LARGER */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={showAltImage ? 'alt' : 'default'}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative h-14 w-14"
                >
                  <Image
                    src={showAltImage ? "/assets/timi-bot1.svg" : "/assets/floating-timi.svg"}
                    alt="Timi Bot"
                    width={56}
                    height={56}
                    className={cn(
                      "h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl",
                      isMinimized && "scale-90"
                    )}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Unread Badge */}
              {hasUnread && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                  !
                </span>
              )}
              
              {/* Minimized Indicator */}
              {isMinimized && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-sm ring-2 ring-white">
                  <MessageCircle className="h-3 w-3" />
                </span>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Desktop Window */}
        {isOpen && !isMinimized && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[380px] max-h-[80vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 backdrop-blur-xl"
          >
            <DesktopHeader />
            <div className="flex-1 overflow-hidden relative">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#1f3463 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
              />
              {chatContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DrawerContent className="h-[90vh] rounded-t-xl">
            <DrawerHeader className="border-b px-4 py-3" style={{ background: 'linear-gradient(135deg, #1f3463 0%, #2cafdd 100%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-md ring-2 ring-white/30">
                    <Image
                      src="/assets/floating-timi.svg"
                      alt="Timi Bot"
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain"
                    />
                    {/* Animated status dot with pulsing ring - Mobile */}
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" style={{ animationDuration: '2s' }} />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                    </span>
                  </div>
                  <div className="text-left">
                    <DrawerTitle className="text-white font-bold">Quick Chat</DrawerTitle>
                    <DrawerDescription className="text-white/80 font-medium">Timi AI Assistant</DrawerDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 hover:text-white rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white">
              {chatContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}