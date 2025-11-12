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
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Loader2,
  Menu,
  X,
  AlertTriangle,
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
import type { SessionSummary } from '@/lib/types/ai'

// ============================================================================
// Types
// ============================================================================

export interface ChatHistoryProps {
  sessions: SessionSummary[]
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => Promise<void>
  isLoading?: boolean
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
  onDeleteSession,
  isLoading = false,
  className,
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Filter sessions based on search query (debounced effect handled in parent)
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return sessions
    }

    const query = searchQuery.toLowerCase()
    return sessions.filter(
      session =>
        session.title?.toLowerCase().includes(query) ||
        session.last_message.toLowerCase().includes(query)
    )
  }, [sessions, searchQuery])

  // Handle delete confirmation
  const handleDeleteClick = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session selection
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }, [])

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!sessionToDelete) return

    setIsDeleting(true)
    try {
      await onDeleteSession(sessionToDelete)
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    } catch (error) {
      console.error('Failed to delete session:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [sessionToDelete, onDeleteSession])

  // Handle session click
  const handleSessionClick = useCallback(
    (sessionId: string) => {
      onSessionSelect(sessionId)
      setMobileOpen(false) // Close mobile drawer after selection
    },
    [onSessionSelect]
  )

  // Handle new chat
  const handleNewChat = useCallback(() => {
    onNewChat()
    setMobileOpen(false)
  }, [onNewChat])

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle chat history"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'flex h-full w-80 flex-col border-r border-border bg-background',
          // Mobile: overlay drawer
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-muted-foreground">
                    Start a new chat to get help from Timi
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredSessions.map(session => {
                const isActive = session.session_id === activeSessionId
                const title =
                  session.title || session.last_message.substring(0, 50) + '...'

                return (
                  <button
                    key={session.session_id}
                    onClick={() => handleSessionClick(session.session_id)}
                    className={cn(
                      'group relative w-full rounded-lg p-3 text-left transition-colors',
                      'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isActive && 'bg-muted/80'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Session Content */}
                    <div className="flex flex-col gap-1.5 pr-8">
                      {/* Title */}
                      <div className="flex items-center gap-2">
                        {session.escalated && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-600" />
                        )}
                        <h3 className="line-clamp-1 text-sm font-medium">
                          {title}
                        </h3>
                      </div>

                      {/* Last Message Preview */}
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {session.last_message}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                            <span>{session.message_count} messages</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={e => handleDeleteClick(session.session_id, e)}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {filteredSessions.length > 0 && (
          <div className="border-t border-border p-4 text-xs text-muted-foreground">
            Showing {filteredSessions.length} of {sessions.length} conversation
            {sessions.length !== 1 && 's'}
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
