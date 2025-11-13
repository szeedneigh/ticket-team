/**
 * ChatWidgetWrapper Component
 *
 * Convenience wrapper that combines ChatWidgetProvider and ChatWidget.
 * Add this to your root layout to enable the floating chat widget
 * across your entire application.
 *
 * @module components/chat/chat-widget-wrapper
 */

'use client'

import { ChatWidgetProvider } from './chat-widget-context'
import { ChatWidget } from './chat-widget'

// ============================================================================
// Types
// ============================================================================

export interface ChatWidgetWrapperProps {
  userName?: string
  userId?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChatWidgetWrapper({ userName, userId }: ChatWidgetWrapperProps) {
  return (
    <ChatWidgetProvider>
      <ChatWidget userName={userName} userId={userId} />
    </ChatWidgetProvider>
  )
}
