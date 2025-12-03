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
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
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
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        'group flex gap-4 px-4 md:px-6 py-6',
        'border-b border-border/30',
        isUser && 'justify-end'
      )}
      role="article"
      aria-label={`${role} message`}
    >
      {/* Avatar */}
      {!isUser && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            rotate: [0, -10, 10, -10, 10, 0],
            transition: { 
              duration: 0.5,
              rotate: {
                delay: 0.2,
                duration: 0.6,
                ease: "easeInOut"
              }
            }
          }}
          className="flex h-10 w-10 shrink-0 select-none items-center justify-center"
          aria-hidden="true"
        >
          {isAssistant ? (
            <div className="relative h-10 w-10">
                <Image
                src="/assets/timi-bot1.svg"
                alt="Timi AI Assistant"
                fill
                className="object-contain drop-shadow-[0_0_8px_rgba(44,175,221,0.4)]"
                priority
                />
            </div>
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </motion.div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-1 flex-col gap-3',
          isUser && 'items-end'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-5 py-4 shadow-sm',
            'max-w-[90%] sm:max-w-[80%] md:max-w-[75%]',
            isUser
              ? 'bg-gradient-to-br from-[#1f3463] to-[#2cafdd] text-white shadow-md'
              : 'bg-background/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm text-foreground',
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
                  'prose prose-sm max-w-none break-words leading-7',
                  isUser
                    ? 'prose-invert prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-a:text-primary-foreground/90 prose-code:text-primary-foreground prose-li:text-primary-foreground'
                    : 'text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary prose-li:text-foreground prose-code:text-foreground dark:prose-invert'
                )}
              >
{content && content.trim() ? (
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      // Customize code blocks
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        // Check if it's a code block (has language class) or inline code
                        const isBlock = match && className
                        return isBlock ? (
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
                ) : (
                  <span className="text-muted-foreground italic">No content</span>
                )}
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
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
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
                    className="group/source flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2 text-sm transition-colors hover:border-[#2cafdd]"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm group-hover/source:text-[#2cafdd] transition-colors">
                        {source.title}
                      </span>
                      {category && (
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {category}
                        </span>
                      )}
                      <span className="text-xs font-medium text-[#2cafdd]">
                        {(source.similarity * 100).toFixed(0)}% match
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
          className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-sm"
          aria-hidden="true"
        >
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </motion.div>
  )
}
