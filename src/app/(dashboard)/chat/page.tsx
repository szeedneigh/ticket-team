/**
 * Chat Page
 *
 * Main chat interface with:
 * - Two-column layout: history sidebar (left) + chat window (right)
 * - Mobile: Stack vertically, collapsible history drawer
 * - Server Component for initial data fetch (session list)
 * - Client components for interactivity
 *
 * @module app/(dashboard)/chat/page
 */

import { requireAuth } from '@/lib/auth/session'
import { getUserChatSessions, createChatSession } from '@/app/actions/chat'
import { ChatPageClient } from '../analytics/chat/page-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

export const metadata = {
  title: 'Chat with Timi | Ticket Team',
  description: 'Get instant IT support from your AI assistant',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  try {
    // Await searchParams (Next.js 15 requirement)
    const params = await searchParams

    // Authenticate user
    let user
    try {
      user = await requireAuth()
    } catch (error) {
      logger.error('Auth error in chat page', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }

    // Get existing sessions with timeout
    const sessionsResult = await Promise.race([
      getUserChatSessions({ limit: 50 }),
      new Promise<{ success: false; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Session fetch timeout after 10 seconds')), 10000)
      ),
    ]).catch((error) => {
      logger.error('Session fetch error or timeout', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user.id,
      })
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Failed to fetch chat sessions',
      }
    })

    if (!sessionsResult.success) {
      logger.error('Failed to fetch chat sessions', {
        error: sessionsResult.error,
        userId: user.id,
      })

      return (
        <div className="flex h-full items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load chat history</AlertTitle>
            <AlertDescription>{sessionsResult.error}</AlertDescription>
          </Alert>
        </div>
      )
    }

    const sessions = sessionsResult.data

    // Determine active session
    // When visiting /chat without ?session=, always start with a fresh session.
    // Users access previous chats only by selecting them from the history sidebar.
    let activeSessionId = params.session || null

    if (!activeSessionId) {
      // Create new session with timeout
      const newSessionResult = await Promise.race([
        createChatSession(),
        new Promise<{ success: false; error: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Session creation timeout after 10 seconds')), 10000)
        ),
      ]).catch((error) => {
        logger.error('Session creation error or timeout', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
        })
        return {
          success: false as const,
          error: error instanceof Error ? error.message : 'Failed to create chat session',
        }
      })

      if (newSessionResult.success) {
        activeSessionId = newSessionResult.data.sessionId
      } else {
        logger.error('Failed to create new chat session', {
          error: newSessionResult.error,
          userId: user.id,
        })

        return (
          <div className="flex h-full items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to start chat</AlertTitle>
              <AlertDescription>
                {newSessionResult.error}
              </AlertDescription>
            </Alert>
          </div>
        )
      }
    }

    // activeSessionId should always be a string at this point
    // (either from searchParams.session or newly created session)
    if (!activeSessionId) {
      logger.error('No active session ID after session initialization', {
        userId: user.id,
      })
      return (
        <div className="flex h-full items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to initialize chat</AlertTitle>
            <AlertDescription>
              Unable to create or load a chat session. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
      <div className="flex h-full min-h-0 overflow-hidden">
        <ChatPageClient
          initialSessions={sessions}
          activeSessionId={activeSessionId}
          userName={user.full_name}
        />
      </div>
    )
  } catch (error) {
    logger.error('Error rendering chat page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading chat</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
