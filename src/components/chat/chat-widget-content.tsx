/**
 * ChatWidgetContent Component
 *
 * Compact, widget-specific chat interface with distinct styling.
 * Optimized for the floating widget use case - more compact than full chat page.
 *
 * @module components/chat/chat-widget-content
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Loader2, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/lib/types/ai'
import ReactMarkdown from 'react-markdown'

// ============================================================================
// Types
// ============================================================================

export interface ChatWidgetContentProps {
  sessionId: string
  initialMessages?: ChatMessageType[]
  userName?: string
  onMessagesChange?: (messages: ChatMessageType[]) => void
}

// ============================================================================
// Widget Message Component (Compact Style)
// ============================================================================

interface WidgetMessageProps {
  message: ChatMessageType
  userName?: string
}

function WidgetMessage({ message, userName }: WidgetMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={cn(
        'group flex gap-3 px-3 py-2.5',
        isUser && 'justify-end'
      )}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2cafdd] to-[#1f3463] ring-2 ring-white shadow-sm overflow-hidden">
          <Image
            src="/assets/timi-bot1.svg"
            alt="Timi Bot"
            width={28}
            height={28}
            className="h-full w-full object-contain p-1"
          />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-gradient-to-br from-[#1f3463] to-[#2cafdd] text-white shadow-md'
            : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 shadow-sm ring-1 ring-slate-200/50'
        )}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                code: ({ children }) => (
                  <code className="rounded bg-slate-200/50 px-1.5 py-0.5 text-xs font-mono text-slate-700">
                    {children}
                  </code>
                ),
                strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200/50 pt-2">
            {message.sources.slice(0, 2).map((source, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-xs text-slate-600"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#2cafdd]" />
                {source.title}
              </span>
            ))}
            {message.sources.length > 2 && (
              <span className="text-xs text-slate-500">+{message.sources.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 ring-2 ring-white shadow-sm">
          <span className="text-xs font-semibold text-slate-600">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function ChatWidgetContent({
  sessionId,
  initialMessages = [],
  userName,
  onMessagesChange,
}: ChatWidgetContentProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync initialMessages when session changes
  useEffect(() => {
    if (initialMessages.length > 0 && JSON.stringify(initialMessages) !== JSON.stringify(messages)) {
      setMessages(initialMessages)
    }
  }, [sessionId, initialMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim()

    if (!trimmedInput || isStreaming) {
      return
    }

    // Add user message optimistically
    const userMessage: ChatMessageType = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    onMessagesChange?.(newMessages)
    setInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setIsStreaming(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: trimmedInput,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let assistantContent = ''
      let sources: ChatMessageType['sources'] = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'content' && parsed.text) {
                assistantContent += parsed.text
                setStreamingContent(assistantContent)
              } else if (parsed.type === 'context' && parsed.contextArticles) {
                sources = parsed.contextArticles
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: ChatMessageType = {
        role: 'assistant',
        content: assistantContent,
        sources,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      onMessagesChange?.(finalMessages)
      setStreamingContent('')
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [input, isStreaming, messages, sessionId, onMessagesChange])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const allMessages = streamingContent
    ? [
        ...messages,
        {
          role: 'assistant' as const,
          content: streamingContent,
          timestamp: new Date().toISOString(),
        },
      ]
    : messages

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white via-slate-50/30 to-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2cafdd] to-[#1f3463] shadow-lg overflow-hidden p-2">
              <Image
                src="/assets/timi-bot1.svg"
                alt="Timi Bot"
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </div>
            <h3 className="mb-2 text-base font-semibold text-slate-800">Hi! I&apos;m Timi</h3>
            <p className="text-sm text-slate-600">
              Ask me anything about IT support, tickets, or help center articles.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => router.push('/chat')}
            >
              Open Full Chat
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            {allMessages.map((message, idx) => (
              <WidgetMessage key={idx} message={message} userName={userName} />
            ))}
            {isStreaming && (
              <div className="flex justify-start px-3 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2cafdd] to-[#1f3463] ring-2 ring-white shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200/60 bg-white/80 p-3 backdrop-blur-sm">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isStreaming}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:border-[#2cafdd] focus:ring-[#2cafdd]/20"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#1f3463] to-[#2cafdd] shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to send
        </p>
      </div>
    </div>
  )
}
