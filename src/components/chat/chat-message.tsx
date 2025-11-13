/**
 * ChatMessage Component
 *
 * Displays a single chat message with:
 * - Markdown rendering with code syntax highlighting
 * - Different styling for user vs AI messages
 * - Timestamp with relative time
 * - Copy button for AI responses
 * - Source citations as clickable links
 * - Streaming animation
 *
 * @module components/chat/chat-message
 */

'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { formatDistanceToNow } from 'date-fns'
import { Copy, Check, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackButtons } from './feedback-buttons'
import { cn } from '@/lib/utils'
import type { RAGContext } from '@/lib/types/ai'
import 'highlight.js/styles/github-dark.css'

// ============================================================================
// Types
// ============================================================================

export interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  sources?: RAGContext[]
  isLoading?: boolean
  isStreaming?: boolean
  interactionId?: string
  wasHelpful?: boolean | null
}

// ============================================================================
// Component
// ============================================================================

export function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  isLoading = false,
  isStreaming = false,
  interactionId,
  wasHelpful,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const isUser = role === 'user'
  const isAssistant = role === 'assistant'

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-6 transition-colors hover:bg-muted/50',
        isUser && 'justify-end'
      )}
      role="article"
      aria-label={`${role} message`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border',
            isAssistant ? 'border-primary/20 bg-primary/10' : 'border-border bg-muted'
          )}
          aria-hidden="true"
        >
          {isAssistant ? (
            <Bot className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-1 flex-col gap-2',
          isUser && 'items-end'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'relative max-w-[85%] rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
            isStreaming && 'animate-pulse'
          )}
        >
          {/* Loading indicator */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
              </div>
              <span className="text-sm">AI is typing...</span>
            </div>
          ) : (
            <>
              {/* Markdown Content */}
              <div
                className={cn(
                  'prose prose-sm max-w-none',
                  isUser
                    ? 'prose-invert prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-a:text-primary-foreground/90 prose-code:text-primary-foreground'
                    : 'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground dark:prose-invert'
                )}
              >
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Customize code blocks
                    code: ({ inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      ) : (
                        <code
                          className={cn(
                            'rounded bg-muted px-1.5 py-0.5 text-sm',
                            isUser && 'bg-primary-foreground/20'
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    // Customize links
                    a: ({ children, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:no-underline"
                      >
                        {children}
                      </a>
                    ),
                    // Customize paragraphs
                    p: ({ children, ...props }) => (
                      <p className="mb-2 last:mb-0" {...props}>
                        {children}
                      </p>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {/* Copy Button (AI messages only) */}
              {isAssistant && !isStreaming && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-2 -top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={handleCopy}
                  aria-label="Copy message"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Metadata Row */}
        <div
          className={cn(
            'flex flex-col gap-2 px-2',
            isUser && 'items-end'
          )}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {/* Timestamp */}
            {timestamp && (
              <time
                dateTime={timestamp}
                title={new Date(timestamp).toLocaleString()}
              >
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </time>
            )}

            {/* Streaming indicator */}
            {isStreaming && (
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Streaming
              </span>
            )}
          </div>

          {/* Feedback Buttons (AI messages only) */}
          {isAssistant && !isStreaming && !isLoading && interactionId && (
            <FeedbackButtons
              interactionId={interactionId}
              initialFeedback={wasHelpful}
            />
          )}
        </div>

        {/* Source Citations */}
        {sources && sources.length > 0 && !isStreaming && (
          <div className="mt-2 max-w-[85%] space-y-2">
            <p className="px-2 text-xs font-medium text-muted-foreground">
              Referenced Articles:
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => {
                const category = (source.metadata as { category?: string })?.category
                return (
                  <a
                    key={source.article_id || index}
                    href={`/kb/${source.article_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/source flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-muted"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium group-hover/source:text-primary">
                        {source.title}
                      </span>
                      {category && (
                        <span className="text-xs text-muted-foreground">
                          {category}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {(source.similarity * 100).toFixed(0)}% relevance
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border border-primary/20 bg-primary/10"
          aria-hidden="true"
        >
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  )
}
