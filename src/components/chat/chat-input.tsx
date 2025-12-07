/**
 * ChatInput Component
 *
 * Auto-resizing textarea for chat message input with:
 * - Auto-resize (1-8 rows based on content)
 * - Send button (disabled when empty or during streaming)
 * - Character limit (2000 chars with counter)
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline, Esc to clear)
 * - Loading state with disabled input
 * - Error display with retry button
 *
 * @module components/chat/chat-input
 */

'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

import { Send, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
  maxLength?: number
  error?: string | null
  onRetry?: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_LENGTH = 2000
const MIN_ROWS = 1
const MAX_ROWS = 8
const LINE_HEIGHT = 24 // approximate line height in pixels

// ============================================================================
// Component
// ============================================================================

export function ChatInput({
  onSend,
  disabled = false,
  isStreaming = false,
  placeholder = 'Ask me anything about IT support...',
  maxLength = DEFAULT_MAX_LENGTH,
  error = null,
  onRetry,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(MIN_ROWS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to recalculate
      textareaRef.current.style.height = 'auto'

      // Calculate number of rows needed
      const scrollHeight = textareaRef.current.scrollHeight
      const newRows = Math.min(
        Math.max(Math.ceil(scrollHeight / LINE_HEIGHT), MIN_ROWS),
        MAX_ROWS
      )

      setRows(newRows)
    }
  }, [message])

  // Handle send message
  const handleSend = async () => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || disabled || isStreaming) {
      return
    }

    // Call onSend callback
    await onSend(trimmedMessage)

    // Clear input after sending
    setMessage('')
    setRows(MIN_ROWS)

    // Focus back on textarea
    textareaRef.current?.focus()
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }

    // Escape to clear
    if (e.key === 'Escape') {
      e.preventDefault()
      setMessage('')
      setRows(MIN_ROWS)
    }
  }

  // Handle input change
  const handleChange = (value: string) => {
    // Enforce character limit
    if (value.length <= maxLength) {
      setMessage(value)
    }
  }

  // Calculate remaining characters
  const remainingChars = maxLength - message.length
  const showCharCount = message.length > maxLength * 0.8 // Show counter at 80%

  // Determine if send button should be disabled
  const isSendDisabled =
    disabled || isStreaming || !message.trim() || message.length > maxLength

  return (
    <div className="flex flex-col gap-2">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="flex-1">{error}</p>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-auto px-2 py-1 text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Input Container */}
      <div className="relative flex items-end gap-3 rounded-3xl bg-background/60 p-2 shadow-lg backdrop-blur-xl ring-1 ring-white/20 dark:ring-white/10 transition-shadow hover:shadow-xl focus-within:shadow-xl focus-within:ring-[#2cafdd]/50">
        {/* Textarea */}
        <div className="relative flex-1 min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            rows={rows}
            className={cn(
              'min-h-[48px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-4 py-3',
              'placeholder:text-muted-foreground/70',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label="Chat message input"
            aria-describedby={error ? 'chat-input-error' : undefined}
          />

          {/* Character Counter */}
          {showCharCount && (
            <div
              className={cn(
                'absolute bottom-2 right-2 text-xs',
                remainingChars < 100
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {remainingChars}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isSendDisabled}
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 rounded-full mb-1 mr-1',
            'bg-gradient-to-br from-[#1f3463] to-[#2cafdd] shadow-md',
            'hover:opacity-90 hover:shadow-lg hover:scale-105',
            'transition-all duration-200',
            isSendDisabled && 'opacity-50 shadow-none hover:scale-100'
          )}
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Send className="h-5 w-5 text-white ml-0.5" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
            Shift+Enter
          </kbd>{' '}
          for new line
        </span>

        {isStreaming && (
          <span className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            AI is responding...
          </span>
        )}
      </div>
    </div>
  )
}
