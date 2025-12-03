'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { SessionSummary } from '@/lib/chat/queries'
import type { ChatMessage } from '@/lib/types/ai'

// ============================================================================
// Types
// ============================================================================

export interface ChatWidgetState {
  isOpen: boolean
  isMinimized: boolean
  activeSessionId: string | null
  sessions: SessionSummary[]
  currentMessages: ChatMessage[]
}

export interface ChatWidgetContextValue {
  // State
  isOpen: boolean
  isMinimized: boolean
  activeSessionId: string | null
  sessions: SessionSummary[]
  currentMessages: ChatMessage[]

  // Actions
  openWidget: () => void
  closeWidget: () => void
  toggleWidget: () => void
  minimizeWidget: () => void
  maximizeWidget: () => void
  setActiveSession: (sessionId: string) => void
  setSessions: (sessions: SessionSummary[]) => void
  setCurrentMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
}

// ============================================================================
// Context
// ============================================================================

const ChatWidgetContext = createContext<ChatWidgetContextValue | undefined>(undefined)

// ============================================================================
// Provider
// ============================================================================

export interface ChatWidgetProviderProps {
  children: ReactNode
}

export function ChatWidgetProvider({ children }: ChatWidgetProviderProps) {
  // Widget state
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([])

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const persistedState = localStorage.getItem('chatWidgetState')
      if (persistedState) {
        const state: Partial<ChatWidgetState> = JSON.parse(persistedState)

        if (state.activeSessionId) {
          setActiveSessionId(state.activeSessionId)
        }
        if (state.isMinimized !== undefined) {
          setIsMinimized(state.isMinimized)
        }
        if (state.isOpen !== undefined) {
          setIsOpen(state.isOpen)
        }
      }
    } catch (error) {
      console.error('Failed to load widget state:', error)
    }
  }, [])

  // Persist state to localStorage on changes
  useEffect(() => {
    try {
      const state: Partial<ChatWidgetState> = {
        activeSessionId,
        isMinimized,
        isOpen,
        // Don't persist sessions or messages (too large)
      }
      localStorage.setItem('chatWidgetState', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to persist widget state:', error)
    }
  }, [activeSessionId, isMinimized, isOpen])

  // Actions
  const openWidget = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeWidget = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleWidget = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const minimizeWidget = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const maximizeWidget = useCallback(() => {
    setIsMinimized(false)
  }, [])

  const setActiveSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setCurrentMessages(prev => [...prev, message])
  }, [])

  // Context value
  const value: ChatWidgetContextValue = {
    // State
    isOpen,
    isMinimized,
    activeSessionId,
    sessions,
    currentMessages,

    // Actions
    openWidget,
    closeWidget,
    toggleWidget,
    minimizeWidget,
    maximizeWidget,
    setActiveSession,
    setSessions,
    setCurrentMessages,
    addMessage,
  }

  return (
    <ChatWidgetContext.Provider value={value}>
      {children}
    </ChatWidgetContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useChatWidget() {
  const context = useContext(ChatWidgetContext)

  if (context === undefined) {
    throw new Error('useChatWidget must be used within a ChatWidgetProvider')
  }

  return context
}
