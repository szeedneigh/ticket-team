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
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatWelcome } from './chat-welcome'
import { ChatSources } from './chat-sources'
import { EscalateButton } from './escalate-button'
import { TicketReviewModal } from './ticket-review-modal'
import { Headset } from 'lucide-react'
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
  type: 'context' | 'content' | 'done' | 'error' | 'interaction'
  text?: string
  contextArticles?: RAGContext[]
  confidence?: number
  responseTime?: number
  citations?: string[]
  shouldEscalate?: boolean
  error?: string
  interactionId?: string
}

interface VirtuosoScrollState {
  scrollTop: number
  scrollHeight: number
  viewportHeight: number
  scrollDirection: 'up' | 'down'
  range: {
    startIndex: number
    endIndex: number
  }
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

  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const streamingContentRef = useRef<string>('')
  const currentInteractionIdRef = useRef<string | null>(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [followOutput, setFollowOutput] = useState<boolean | "smooth" | "auto">("smooth")

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:mount',message:'ChatClient mounted',data:{sessionId,initialMessagesCount:initialMessages.length,lastMessageRole:initialMessages[initialMessages.length-1]?.role,lastMessageContent:initialMessages[initialMessages.length-1]?.content?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
  }, [sessionId, initialMessages]);
  // #endregion

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:messages-change',message:'Messages state changed',data:{messagesCount:messages.length,lastMessageRole:messages[messages.length-1]?.role,lastMessageIndex:messages.length-1,hasVirtuosoRef:!!virtuosoRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H5'})}).catch(()=>{});
  }, [messages]);
  // #endregion

  // Sync initialMessages when session changes (if component doesn't remount)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:sync-initial',message:'Syncing initialMessages',data:{sessionId,initialMessagesCount:initialMessages.length,currentMessagesCount:messages.length,areEqual:JSON.stringify(initialMessages)===JSON.stringify(messages)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (initialMessages.length > 0 && JSON.stringify(initialMessages) !== JSON.stringify(messages)) {
      setMessages(initialMessages)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:sync-initial-set',message:'Set messages from initialMessages',data:{sessionId,newMessagesCount:initialMessages.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    }
  }, [sessionId, initialMessages])

  // Scroll to bottom when messages load (for session switching)
  useEffect(() => {
    if (messages.length > 0 && virtuosoRef.current && !isStreaming && !isUserScrollingRef.current) {
      const lastMessage = messages[messages.length - 1];
      const lastUserMessageIndex = messages.map((m, i) => ({role: m.role, index: i})).filter(m => m.role === 'user').pop()?.index ?? -1;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:scroll-effect',message:'Attempting scroll to bottom',data:{sessionId,messagesCount:messages.length,lastMessageRole:lastMessage?.role,lastMessageIndex:messages.length-1,lastUserMessageIndex,hasVirtuosoRef:!!virtuosoRef.current,isStreaming,isUserScrolling:isUserScrollingRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
      // #endregion
      // Use setTimeout to ensure Virtuoso has finished rendering
      const timeoutId = setTimeout(() => {
        if (virtuosoRef.current && !isUserScrollingRef.current) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:scroll-execute',message:'Executing scrollTo with large offset',data:{sessionId,messagesCount:messages.length,lastMessageRole:lastMessage?.role,lastUserMessageIndex},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H4,H5'})}).catch(()=>{});
          // #endregion
          // Use scrollTo with a very large value to ensure we reach the absolute bottom
          virtuosoRef.current.scrollTo({
            top: 999999,
            behavior: 'smooth'
          })
        }
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [sessionId, messages.length, isStreaming])

  // Notify parent of message changes (for widget state management)
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages)
    }
  }, [messages, onMessagesChange])

  // Handle sending a message
  const handleSendMessage = useCallback(async (message: string) => {
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
    streamingContentRef.current = ''
    currentInteractionIdRef.current = null
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
                // Received text chunk - update both state and ref
                streamingContentRef.current += chunk.text
                setStreamingContent(streamingContentRef.current)
              } else if (chunk.type === 'interaction') {
                // Received interaction ID for escalation support
                // Update the last assistant message with the interaction ID
                if (chunk.interactionId) {
                  currentInteractionIdRef.current = chunk.interactionId
                  setMessages(prev => {
                    const newMessages = [...prev]
                    // Find the last assistant message and update its metadata
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i].role === 'assistant') {
                        newMessages[i] = {
                          ...newMessages[i],
                          metadata: {
                            ...newMessages[i].metadata,
                            interaction_id: chunk.interactionId,
                          },
                        }
                        break
                      }
                    }
                    return newMessages
                  })
                }
              } else if (chunk.type === 'done') {
                // Stream complete - use ref for accurate content
                const finalContent = streamingContentRef.current + (chunk.text || '')

                // Add assistant message (interaction ID will be added by 'interaction' chunk)
                const assistantMessage: ChatMessageType = {
                  role: 'assistant',
                  content: finalContent,
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
                streamingContentRef.current = ''
                setCurrentSources([])
              } else if (chunk.type === 'error') {
                // Server signaled an error; surface to the user and stop streaming gracefully
                const serverMessage = chunk.error || 'An error occurred while processing your request'
                
                // Update UI state without throwing (avoids noisy console errors)
                setError(serverMessage)
                toast.error('Chat Error', {
                  description: serverMessage,
                  duration: 5000,
                })
                
                // Cancel further streaming and clear transient state
                await reader.cancel().catch(() => null)
                setIsStreaming(false)
                setStreamingContent('')
                streamingContentRef.current = ''
                currentInteractionIdRef.current = null
                setCurrentSources([])

                // Remove the optimistic user message since the request failed
                setMessages(prev => prev.slice(0, -1))

                return
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
      streamingContentRef.current = ''
      currentInteractionIdRef.current = null
      setCurrentSources([])
    } finally {
      setIsStreaming(false)
    }
  }, [messages, sessionId, currentSources])

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
  }, [messages, handleSendMessage])

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
  }, [handleSendMessage])

  // Prepare items for virtualized list (messages + streaming + escalation)
  const displayItems = [...messages]

  // Add streaming message
  if (isStreaming && streamingContent) {
    displayItems.push({
      role: 'assistant' as const,
      content: streamingContent,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    })
  } else if (isStreaming && !streamingContent) {
    displayItems.push({
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    })
  }

  // #region agent log
  useEffect(() => {
    if (displayItems.length > 0) {
      const lastItem = displayItems[displayItems.length - 1];
      const messageRoles = displayItems.map(m => m.role);
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:display-items',message:'Display items updated',data:{sessionId,displayItemsCount:displayItems.length,lastItemRole:lastItem.role,lastItemIndex:displayItems.length-1,messageRoles:messageRoles.slice(-5)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
    }
  }, [displayItems.length, sessionId]);
  // #endregion

  return (
    <div className="flex h-full flex-col relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full px-4 md:px-8">
          {messages.length === 0 && !isStreaming ? (
            <ChatWelcome
              onPromptClick={handlePromptClick}
              userName={userName}
            />
          ) : (
            <Virtuoso
              ref={virtuosoRef}
              style={{ height: '100%' }}
              data={displayItems}
              followOutput={followOutput}
              alignToBottom
              initialTopMostItemIndex={displayItems.length > 0 ? displayItems.length - 1 : undefined}
              // #region agent log
              onScroll={((state: any) => {
                const lastMessage = displayItems[displayItems.length - 1];
                const lastUserMessageIndex = displayItems.map((m, i) => ({role: m.role, index: i})).filter(m => m.role === 'user').pop()?.index ?? -1;
                const scrollState = state as VirtuosoScrollState;
                const isAtBottom = scrollState.scrollTop >= (scrollState.scrollHeight - scrollState.viewportHeight - 10);
                const isScrollingDown = scrollState.scrollDirection === 'down';
                
                // Detect user-initiated scrolling (not programmatic)
                if (isScrollingDown && !isAtBottom) {
                  isUserScrollingRef.current = true;
                  setFollowOutput(false);
                  // Clear any existing timeout
                  if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                  }
                  // Reset flag after user stops scrolling
                  scrollTimeoutRef.current = setTimeout(() => {
                    isUserScrollingRef.current = false;
                    setFollowOutput("smooth");
                  }, 1000);
                }
                
                fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-client.tsx:scroll-event',message:'Virtuoso scroll event',data:{sessionId,scrollTop:scrollState.scrollTop,scrollHeight:scrollState.scrollHeight,viewportHeight:scrollState.viewportHeight,scrollDirection:scrollState.scrollDirection,range:scrollState.range,displayItemsCount:displayItems.length,lastIndex:displayItems.length-1,lastMessageRole:lastMessage?.role,lastUserMessageIndex,isAtBottom,isUserScrolling:isUserScrollingRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H4'})}).catch(()=>{});
              }) as any}
              // #endregion
              itemContent={(index, message) => (
                <div key={index}>
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    sources={message.sources}
                    isStreaming={message.isStreaming}
                    isLoading={message.isLoading}
                  />

                  {/* Show sources if available */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="px-4 pb-4">
                      <ChatSources sources={message.sources} />
                    </div>
                  )}

                  {/* Escalation Prompt after last message */}
                  {index === displayItems.length - 1 &&
                    shouldShowEscalate &&
                    !isStreaming && (
                      <div className="px-4 pb-6 pt-2">
                        <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 p-5 shadow-sm dark:border-indigo-900/30 dark:from-slate-900 dark:to-indigo-950/30">
                          {/* Decorative background element */}
                          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-50/80 blur-3xl dark:bg-indigo-900/10" />
                          
                          <div className="relative z-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:ring-indigo-900">
                                <Headset className="h-5 w-5" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-semibold text-foreground">
                                  Need human support?
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Our team is ready to help resolve this issue.
                                </p>
                              </div>
                            </div>
                            
                            <EscalateButton
                              onClick={handleEscalateClick}
                              variant="default"
                              size="sm"
                              className="w-full shrink-0 bg-gradient-to-r from-[#1f3463] to-[#2cafdd] text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 sm:w-auto"
                            >
                              Create Ticket
                            </EscalateButton>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 pb-6 md:pb-8">
        <div className="mx-auto w-full max-w-4xl">
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
