/**
 * ChatHistory Component
 *
 * Sidebar displaying user's chat sessions with:
 * - List of sessions sorted by most recent
 * - Session title, last message preview, and timestamp
 * - Active session highlighting
 * - Click to switch sessions
 * - Delete button with confirmation
 * - "New Chat" button
 * - Search/filter functionality (debounced)
 * - Mobile: Collapsible drawer
 *
 * @module components/chat/chat-history
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Loader2,
  X,
  AlertTriangle,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { SessionSummary } from '@/lib/chat/queries'

// ============================================================================
// Types
// ============================================================================

export interface ChatHistoryProps {
  sessions: SessionSummary[]
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onArchiveSession: (sessionId: string) => Promise<void> // Renamed from onDeleteSession
  isLoading?: boolean
  isOpen: boolean
  onToggle: () => void
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChatHistory({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onArchiveSession, // Renamed from onDeleteSession
  isLoading = false,
  isOpen,
  onToggle,
  className,
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [sessionToArchive, setSessionToArchive] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedSessions, setArchivedSessions] = useState<SessionSummary[]>([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)

  // Filter sessions based on search query (debounced effect handled in parent)
  const filteredSessions = useMemo(() => {
    const sessionsToFilter = showArchived ? archivedSessions : sessions
    
    if (!searchQuery.trim()) {
      return sessionsToFilter
    }

    const query = searchQuery.toLowerCase()
    return sessionsToFilter.filter(
      session =>
        session.title?.toLowerCase().includes(query) ||
        session.last_message.toLowerCase().includes(query)
    )
  }, [sessions, archivedSessions, showArchived, searchQuery])

  // Handle archive click
  const handleArchiveClick = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session selection
    setSessionToArchive(sessionId)
    setArchiveDialogOpen(true)
  }, [])

  // Handle archive confirmation
  const handleArchiveConfirm = useCallback(async () => {
    if (!sessionToArchive) return

    setIsArchiving(true)
    try {
      await onArchiveSession(sessionToArchive)
      setArchiveDialogOpen(false)
      setSessionToArchive(null)
    } catch (error) {
      console.error('Failed to archive session:', error)
    } finally {
      setIsArchiving(false)
    }
  }, [sessionToArchive, onArchiveSession])

  // Load archived sessions
  const loadArchivedSessions = useCallback(async () => {
    setIsLoadingArchived(true)
    try {
      const { getArchivedChatSessions } = await import('@/app/actions/chat')
      const result = await getArchivedChatSessions()
      
      console.log('[ChatHistory] Archived sessions result:', {
        success: result.success,
        count: result.success ? result.data.length : 0,
        error: !result.success ? result.error : undefined
      })
      
      if (result.success) {
        setArchivedSessions(result.data)
        setShowArchived(true)
      } else {
        console.error('Failed to load archived sessions:', result.error)
        toast.error(result.error || 'Failed to load archived conversations')
      }
    } catch (error) {
      console.error('Failed to load archived sessions:', error)
      toast.error('Failed to load archived conversations')
    } finally {
      setIsLoadingArchived(false)
    }
  }, [])

  // Handle session click
  const handleSessionClick = useCallback(
    (sessionId: string) => {
      onSessionSelect(sessionId)
      // Close drawer after selection (on mobile only)
      if (window.innerWidth < 768) {
        onToggle()
      }
    },
    [onSessionSelect, onToggle]
  )

  // Handle new chat
  const handleNewChat = useCallback(() => {
    onNewChat()
    // Close drawer after creating new chat (on mobile only)
    if (window.innerWidth < 768) {
      onToggle()
    }
  }, [onNewChat, onToggle])

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop - glassmorphism */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={onToggle}
              aria-hidden="true"
            />

            {/* History Panel - RIGHT side */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: 0.2,
                ease: [0.2, 0.7, 0.2, 1]
              }}
              className={cn(
                'flex h-full flex-col',
                'w-full md:w-80',
                'bg-background/80 backdrop-blur-md',
                'border-l border-border/50',
                'fixed right-0 top-0 z-50 md:relative',
                'shadow-xl md:shadow-none',
                className
              )}
            >
              {/* Header */}
              <div className="flex flex-col gap-4 border-b border-border/50 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#1f3463] to-[#2cafdd] bg-clip-text text-transparent">
                    History
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    aria-label="Close chat history"
                    className="md:hidden"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* New Chat Button */}
                <Button
                  onClick={handleNewChat}
                  className="w-full gap-2 bg-gradient-to-r from-[#1f3463] to-[#2cafdd] text-white shadow-md hover:opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>

                {/* Search Input */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#2cafdd]" />
                  <Input
                    type="search"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/50 border-border/50 focus-visible:ring-[#2cafdd]/50 transition-all"
                  />
                </div>

                {/* Show Archived Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showArchived ? () => setShowArchived(false) : loadArchivedSessions}
                  disabled={isLoadingArchived}
                  className="w-full gap-2"
                >
                  <History className="h-4 w-4" />
                  {isLoadingArchived ? 'Loading...' : showArchived ? 'Show Active' : 'Show Archived'}
                </Button>
              </div>

              {/* Sessions List */}
              <ScrollArea className="flex-1 px-3 py-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {showArchived 
                          ? 'No archived conversations' 
                          : searchQuery 
                            ? 'No conversations found' 
                            : 'No conversations yet'}
                      </p>
                      {!searchQuery && !showArchived && (
                        <p className="text-xs text-muted-foreground">
                          Start a new chat to get help from Timi
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map(session => {
                      const isActive = session.session_id === activeSessionId
                      const title =
                        session.title || session.last_message.substring(0, 50) + '...'

                      return (
                        <div
                          key={session.session_id}
                          onClick={() => handleSessionClick(session.session_id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleSessionClick(session.session_id)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'group relative w-full cursor-pointer rounded-xl p-3 text-left transition-all duration-200',
                            'border',
                            isActive 
                              ? 'bg-gradient-to-r from-[#2cafdd]/10 to-transparent border-[#2cafdd]/30 shadow-sm' 
                              : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {/* Active Indicator Line */}
                          {isActive && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#2cafdd]" />
                          )}

                          {/* Session Content */}
                          <div className={cn("flex flex-col gap-1.5 pr-8", isActive && "pl-2")}>
                            {/* Title */}
                            <div className="flex items-center gap-2">
                              {session.escalated && (
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-600" />
                              )}
                              <h3 className={cn(
                                "line-clamp-1 text-sm font-medium transition-colors",
                                isActive ? "text-[#2cafdd]" : "text-foreground group-hover:text-foreground/90"
                              )}>
                                {title}
                              </h3>
                            </div>

                            {/* Last Message Preview */}
                            <p className="line-clamp-2 text-xs text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                              {session.last_message}
                            </p>

                            {/* Metadata */}
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                              <time
                                dateTime={session.last_message_at}
                                title={new Date(session.last_message_at).toLocaleString()}
                              >
                                {formatDistanceToNow(new Date(session.last_message_at), {
                                  addSuffix: true,
                                })}
                              </time>
                              {session.message_count > 1 && (
                                <>
                                  <span>•</span>
                                  <span>{session.message_count} msgs</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Archive Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            onClick={e => handleArchiveClick(session.session_id, e)}
                            aria-label="Archive conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {(showArchived ? archivedSessions : filteredSessions).length > 0 && (
                <div className="border-t border-border p-4 text-xs text-muted-foreground">
                  {showArchived 
                    ? `Showing ${archivedSessions.length} archived conversation${archivedSessions.length !== 1 ? 's' : ''}`
                    : `Showing ${filteredSessions.length} of ${sessions.length} conversation${sessions.length !== 1 ? 's' : ''}`}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive this conversation. It will be hidden from your active conversations but can be viewed in the archived section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={isArchiving}
              className="bg-[#2cafdd] text-white hover:bg-[#2cafdd]/90"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                'Archive'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
