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
  archiveChatSession,
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:session-select-start',message:'Session selection started',data:{fromSessionId:activeSessionId,toSessionId:sessionId,hasCachedMessages:!!sessionMessages[sessionId]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
      // #endregion

      setIsLoadingSession(true)
      
      try {
        // Update URL first
        const params = new URLSearchParams(searchParams.toString())
        params.set('session', sessionId)
        router.replace(`/chat?${params.toString()}`)

        // Always fetch fresh messages to ensure we have the latest
        const result = await getChatSession(sessionId)

        if (!result.success) {
          toast.error(result.error || 'Failed to load conversation')
          return
        }

        if (result.data) {
          const loadedMessages = result.data.messages
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:session-select-loaded',message:'Session messages loaded',data:{sessionId,messagesCount:loadedMessages.length,lastMessageRole:loadedMessages[loadedMessages.length-1]?.role,lastMessageIndex:loadedMessages.length-1},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H5'})}).catch(()=>{});
          // #endregion
          
          // Update messages cache
          setSessionMessages(prev => ({
            ...prev,
            [sessionId]: loadedMessages,
          }))
          
          // Update active session ID after messages are loaded
          setActiveSessionId(sessionId)
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:session-select-complete',message:'Session switch complete',data:{sessionId,activeSessionId:sessionId,messagesCount:loadedMessages.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
          // #endregion
        } else {
          // Session exists but has no messages - still switch to it
          setSessionMessages(prev => ({
            ...prev,
            [sessionId]: [],
          }))
          setActiveSessionId(sessionId)
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
    setIsLoadingSession(true)
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
      
      // Initialize empty messages for new session
      setSessionMessages(prev => ({
        ...prev,
        [newSessionId]: [],
      }))

      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      params.set('session', newSessionId)
      router.push(`/chat?${params.toString()}`)

      toast.success('New chat started')
    } catch (error) {
      console.error('Failed to create new chat:', error)
      toast.error('Failed to create new chat')
    } finally {
      setIsLoadingSession(false)
    }
  }, [router, searchParams])

  // Handle session archiving
  const handleArchiveSession = useCallback(
    async (sessionId: string) => {
      try {
        const result = await archiveChatSession(sessionId)

        if (!result.success) {
          toast.error(result.error || 'Failed to archive conversation')
          return
        }

        // Calculate remaining sessions BEFORE updating state
        const remainingSessions = sessions.filter(
          s => s.session_id !== sessionId
        )

        // Remove from sessions list
        setSessions(remainingSessions)

        // Clear cached messages
        setSessionMessages(prev => {
          const updated = { ...prev }
          delete updated[sessionId]
          return updated
        })

        toast.success('Conversation archived')

        // If archived session was active, switch to another
        if (sessionId === activeSessionId) {
          if (remainingSessions.length > 0) {
            // Switch to the first remaining session
            await handleSessionSelect(remainingSessions[0].session_id)
          } else {
            // Create new session if no sessions left
            await handleNewChat()
          }
        }
      } catch (error) {
        console.error('Failed to archive session:', error)
        toast.error('Failed to archive conversation')
      }
    },
    [activeSessionId, sessions, handleSessionSelect, handleNewChat]
  )

  return (
    <>
      {/* Chat Area - NOW FIRST */}
      <div className="flex flex-1 flex-col relative h-full overflow-hidden bg-background/50 backdrop-blur-sm">
        {/* History Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'fixed z-50',
            'top-4 right-4',
            'md:top-6 md:right-6',
            'hover:bg-muted/50'
          )}
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          aria-label={isHistoryOpen ? 'Close chat history' : 'Open chat history'}
        >
          <History className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="flex-1 w-full flex flex-col h-full">
          {isLoadingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2cafdd] mx-auto" />
                <p className="text-sm text-muted-foreground">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <ChatClient
              key={activeSessionId} // Re-mount on session change
              sessionId={activeSessionId}
              initialMessages={sessionMessages[activeSessionId] || []}
              userName={userName}
            />
          )}
        </div>
      </div>

      {/* Chat History - NOW SECOND (renders on right) */}
      <ChatHistory
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onArchiveSession={handleArchiveSession}
        isLoading={isLoadingSession}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />
    </>
  )
}
