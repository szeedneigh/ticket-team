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
import { ChatPageClient } from './page-client'
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

    // Get existing sessions
    const sessionsResult = await getUserChatSessions({ limit: 50 })

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
    let activeSessionId = params.session || null

    // If no active session specified, create a new one or use the most recent
    if (!activeSessionId) {
      if (sessions.length > 0) {
        // Use most recent session
        activeSessionId = sessions[0].session_id
      } else {
        // Create new session
        const newSessionResult = await createChatSession()

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
    }

    // activeSessionId should always be a string at this point
    // (either from searchParams, most recent session, or newly created session)
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
      <div className="flex h-full">
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
