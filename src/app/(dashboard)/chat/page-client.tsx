/**
 * ChatPageClient Component
 *
 * Client-side wrapper for chat page that coordinates:
 * - ChatHistory sidebar
 * - ChatClient main area
 * - Session switching
 * - Session creation and deletion
 *
 * @module app/(dashboard)/chat/page-client
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatHistory } from '@/components/chat/chat-history'
import { ChatClient } from '@/components/chat/chat-client'
import {
  createChatSession,
  deleteChatSession,
  getChatSession,
} from '@/app/actions/chat'
import type { SessionSummary } from '@/lib/chat/queries'
import type { ChatMessage } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ChatPageClientProps {
  initialSessions: SessionSummary[]
  activeSessionId: string
  userName?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChatPageClient({
  initialSessions,
  activeSessionId: initialActiveSessionId,
  userName,
}: ChatPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sessions, setSessions] = useState<SessionSummary[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string>(
    initialActiveSessionId
  )
  const [sessionMessages, setSessionMessages] = useState<
    Record<string, ChatMessage[]>
  >({})
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Handle session selection
  const handleSessionSelect = useCallback(
    async (sessionId: string) => {
      if (sessionId === activeSessionId) {
        return // Already active
      }

      setIsLoadingSession(true)
      setActiveSessionId(sessionId)

      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      params.set('session', sessionId)
      router.push(`/chat?${params.toString()}`)

      try {
        // Fetch session messages if not cached
        if (!sessionMessages[sessionId]) {
          const result = await getChatSession(sessionId)

          if (!result.success) {
            toast.error(result.error || 'Failed to load conversation')
          } else if (result.data) {
            setSessionMessages(prev => ({
              ...prev,
              [sessionId]: result.data!.messages,
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error)
        toast.error('Failed to load conversation')
      } finally {
        setIsLoadingSession(false)
      }
    },
    [activeSessionId, router, searchParams, sessionMessages]
  )

  // Handle new chat creation
  const handleNewChat = useCallback(async () => {
    try {
      const result = await createChatSession()

      if (!result.success) {
        toast.error(result.error || 'Failed to create new chat')
        return
      }

      const newSessionId = result.data.sessionId

      // Add to sessions list
      const newSession: SessionSummary = {
        session_id: newSessionId,
        title: null,
        last_message: 'New conversation',
        last_message_at: new Date().toISOString(),
        message_count: 0,
        escalated: false,
      }

      setSessions(prev => [newSession, ...prev])
      setActiveSessionId(newSessionId)

      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      params.set('session', newSessionId)
      router.push(`/chat?${params.toString()}`)

      toast.success('New chat started')
    } catch (error) {
      console.error('Failed to create new chat:', error)
      toast.error('Failed to create new chat')
    }
  }, [router, searchParams])

  // Handle session deletion
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const result = await deleteChatSession(sessionId)

        if (!result.success) {
          toast.error(result.error || 'Failed to delete conversation')
          return
        }

        // Remove from sessions list
        setSessions(prev => prev.filter(s => s.session_id !== sessionId))

        // Clear cached messages
        setSessionMessages(prev => {
          const updated = { ...prev }
          delete updated[sessionId]
          return updated
        })

        // If deleted session was active, switch to another
        if (sessionId === activeSessionId) {
          const remainingSessions = sessions.filter(
            s => s.session_id !== sessionId
          )

          if (remainingSessions.length > 0) {
            handleSessionSelect(remainingSessions[0].session_id)
          } else {
            // Create new session if no sessions left
            handleNewChat()
          }
        }

        toast.success('Conversation deleted')
      } catch (error) {
        console.error('Failed to delete session:', error)
        toast.error('Failed to delete conversation')
      }
    },
    [activeSessionId, sessions, handleSessionSelect, handleNewChat]
  )

  return (
    <>
      {/* Chat Area - NOW FIRST */}
      <div className="flex flex-1 flex-col relative">
        {/* History Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'fixed z-50',
            'top-20 right-4',
            'md:top-24 md:right-6',
            'lg:top-6 lg:right-6'
          )}
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          aria-label={isHistoryOpen ? 'Close chat history' : 'Open chat history'}
        >
          <History className="h-5 w-5" />
        </Button>

        <ChatClient
          key={activeSessionId} // Re-mount on session change
          sessionId={activeSessionId}
          initialMessages={sessionMessages[activeSessionId] || []}
          userName={userName}
        />
      </div>

      {/* Chat History - NOW SECOND (renders on right) */}
      <ChatHistory
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isLoading={isLoadingSession}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />
    </>
  )
}
