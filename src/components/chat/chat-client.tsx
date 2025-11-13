/**
 * ChatClient Component
 *
 * Main client-side chat interface that orchestrates all chat components:
 * - State management (messages, streaming, errors)
 * - Streaming response handling via fetch + ReadableStream
 * - Optimistic updates (add user message immediately)
 * - Auto-scroll to bottom on new messages
 * - Integration with all chat UI components
 *
 * @module components/chat/chat-client
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatWelcome } from './chat-welcome'
import { ChatSources } from './chat-sources'
import { EscalateButton } from './escalate-button'
import { TicketReviewModal } from './ticket-review-modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import {
  prepareTicketFromChat,
  createTicketFromChat,
} from '@/app/actions/chat'
import {
  trackParsingError,
  trackNetworkError,
  classifyError,
  isRetryableError,
  recordErrorOccurrence,
} from '@/lib/monitoring/error-tracking'
import type { ChatMessage as ChatMessageType, RAGContext } from '@/lib/types/ai'
import type { TicketPreparation } from '@/lib/chat/escalation-utils'

// ============================================================================
// Types
// ============================================================================

export interface ChatClientProps {
  sessionId: string
  initialMessages?: ChatMessageType[]
  userName?: string
  onMessagesChange?: (messages: ChatMessageType[]) => void
}

interface StreamChunk {
  type: 'context' | 'content' | 'done' | 'error'
  text?: string
  contextArticles?: RAGContext[]
  confidence?: number
  responseTime?: number
  citations?: string[]
  shouldEscalate?: boolean
  error?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChatClient({
  sessionId,
  initialMessages = [],
  userName,
  onMessagesChange,
}: ChatClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentSources, setCurrentSources] = useState<RAGContext[]>([])
  const [shouldShowEscalate, setShouldShowEscalate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Escalation modal state
  const [escalationModalOpen, setEscalationModalOpen] = useState(false)
  const [ticketPreparation, setTicketPreparation] = useState<TicketPreparation | null>(null)
  const [isPreparingTicket, setIsPreparingTicket] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Notify parent of message changes (for widget state management)
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages)
    }
  }, [messages, onMessagesChange])

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    // Clear any previous errors
    setError(null)
    setShouldShowEscalate(false)

    // Add user message optimistically
    const userMessage: ChatMessageType = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    // Start streaming
    setIsStreaming(true)
    setStreamingContent('')
    setCurrentSources([])

    try {
      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      // Make streaming request
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Process streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decode chunk
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines (SSE format)
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            try {
              const chunk: StreamChunk = JSON.parse(data)

              if (chunk.type === 'context') {
                // Received context articles
                setCurrentSources(chunk.contextArticles || [])
              } else if (chunk.type === 'content' && chunk.text) {
                // Received text chunk
                setStreamingContent(prev => prev + chunk.text)
              } else if (chunk.type === 'done') {
                // Stream complete
                const finalContent = streamingContent + (chunk.text || '')

                // Add assistant message
                const assistantMessage: ChatMessageType = {
                  role: 'assistant',
                  content: finalContent || streamingContent,
                  timestamp: new Date().toISOString(),
                  sources: currentSources,
                }
                setMessages(prev => [...prev, assistantMessage])

                // Check if escalation should be suggested
                if (chunk.shouldEscalate) {
                  setShouldShowEscalate(true)
                }

                // Clear streaming state
                setStreamingContent('')
                setCurrentSources([])
              } else if (chunk.type === 'error') {
                // Error occurred - throw to be caught by outer catch block
                throw new Error(chunk.error || 'An error occurred while processing your request')
              }
            } catch (parseError) {
              // Log parsing errors for debugging
              console.error('Failed to parse chunk:', parseError)
              console.error('Raw chunk data:', data)
              
              // Track parsing error for monitoring
              if (parseError instanceof Error) {
                trackParsingError(parseError, data, 'client', sessionId)
              }
              
              // If this is a JSON parse error, throw to outer catch
              // This will be caught by the outer try-catch and shown to the user
              if (parseError instanceof SyntaxError) {
                throw new Error('Received invalid response from server. Please try again.')
              }
              
              // Re-throw other errors (like the Error chunks)
              throw parseError
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      // Track error for monitoring
      if (error instanceof Error) {
        const errorCategory = classifyError(error)
        const isRetryable = isRetryableError(error)
        
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          category: errorCategory,
          isRetryable,
          stack: error.stack,
        })
        
        // Track network errors specifically
        if (error.message.includes('HTTP error') || error.message.includes('fetch')) {
          trackNetworkError(error, '/api/v1/ai/chat', 'client')
        }
        
        // Record error occurrence for statistics
        recordErrorOccurrence(error, {
          category: errorCategory,
          sessionId,
          query: message,
        })
      }
      
      // Determine user-friendly error message
      let errorMessage = 'Failed to get response. Please try again.'
      
      if (error instanceof Error) {
        // Use the error message if it's user-friendly
        if (error.message.includes('trouble generating') ||
            error.message.includes('high demand') ||
            error.message.includes('Connection issue') ||
            error.message.includes('knowledge base') ||
            error.message.includes('invalid response')) {
          errorMessage = error.message
        } else if (error.message.includes('HTTP error')) {
          errorMessage = 'Server error occurred. Please try again in a moment.'
        } else if (error.message.includes('No response body')) {
          errorMessage = 'No response received from server. Please check your connection.'
        }
      }
      
      setError(errorMessage)
      
      // Show toast notification for better visibility
      toast.error('Chat Error', {
        description: errorMessage,
        duration: 5000,
      })

      // Remove optimistic user message on error
      setMessages(prev => prev.slice(0, -1))
      
      // Clear any partial streaming content
      setStreamingContent('')
      setCurrentSources([])
    } finally {
      setIsStreaming(false)
    }
  }

  // Handle retry after error
  const handleRetry = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find(m => m.role === 'user')

      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content)
      }
    }
  }, [messages])

  // Handle escalation button click
  const handleEscalateClick = async () => {
    setIsPreparingTicket(true)
    setEscalationModalOpen(true)

    try {
      // Find the last interaction (last AI response)
      const lastAiMessage = messages
        .slice()
        .reverse()
        .find(m => m.role === 'assistant')

      if (!lastAiMessage) {
        toast.error('No interaction found to escalate')
        setEscalationModalOpen(false)
        return
      }

      // Prepare ticket data
      const result = await prepareTicketFromChat({
        sessionId,
        interactionId: lastAiMessage.metadata?.interaction_id as string,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to prepare ticket')
        setEscalationModalOpen(false)
        return
      }

      setTicketPreparation(result.data)
    } catch (error) {
      console.error('Failed to prepare ticket:', error)
      toast.error('Failed to prepare ticket')
      setEscalationModalOpen(false)
    } finally {
      setIsPreparingTicket(false)
    }
  }

  // Handle ticket creation
  const handleCreateTicket = async (data: {
    title: string
    description: string
    category: string
    priority: 'low' | 'medium' | 'high'
    assignedTo?: string
    userAdditions?: string
  }) => {
    try {
      // Find the last interaction
      const lastAiMessage = messages
        .slice()
        .reverse()
        .find(m => m.role === 'assistant')

      if (!lastAiMessage) {
        throw new Error('No interaction found')
      }

      const result = await createTicketFromChat({
        interactionId: lastAiMessage.metadata?.interaction_id as string,
        sessionId,
        ...data,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create ticket')
      }

      toast.success('Ticket created successfully!', {
        action: {
          label: 'View Ticket',
          onClick: () => router.push(`/tickets/${result.data.ticketId}`),
        },
      })

      setEscalationModalOpen(false)
      setShouldShowEscalate(false)
    } catch (error) {
      console.error('Failed to create ticket:', error)
      throw error // Re-throw so modal can handle it
    }
  }

  // Handle suggested prompt click
  const handlePromptClick = useCallback((prompt: string) => {
    handleSendMessage(prompt)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="mx-auto max-w-4xl">
          {messages.length === 0 && !isStreaming ? (
            <ChatWelcome
              onPromptClick={handlePromptClick}
              userName={userName}
            />
          ) : (
            <div className="flex flex-col">
              {/* Existing Messages */}
              {messages.map((message, index) => (
                <div key={index}>
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    sources={message.sources}
                  />

                  {/* Show sources if available */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="px-4 pb-4">
                      <ChatSources sources={message.sources} />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming Message */}
              {isStreaming && streamingContent && (
                <ChatMessage
                  role="assistant"
                  content={streamingContent}
                  isStreaming={true}
                />
              )}

              {/* Loading Indicator */}
              {isStreaming && !streamingContent && (
                <ChatMessage
                  role="assistant"
                  content=""
                  isLoading={true}
                />
              )}

              {/* Escalation Button */}
              {shouldShowEscalate && !isStreaming && (
                <div className="px-4 pb-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        Can&apos;t find what you need? Create a support ticket for
                        personalized assistance.
                      </span>
                      <EscalateButton
                        onClick={handleEscalateClick}
                        variant="default"
                        size="sm"
                      />
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <ChatInput
            onSend={handleSendMessage}
            disabled={false}
            isStreaming={isStreaming}
            error={error}
            onRetry={handleRetry}
          />
        </div>
      </div>

      {/* Ticket Review Modal */}
      <TicketReviewModal
        open={escalationModalOpen}
        onOpenChange={setEscalationModalOpen}
        preparation={ticketPreparation}
        isLoading={isPreparingTicket}
        onSubmit={handleCreateTicket}
      />
    </div>
  )
}
