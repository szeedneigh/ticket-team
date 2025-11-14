/**
 * ChatWelcome Component
 *
 * Empty state component displayed when no messages in session:
 * - Welcome message introducing Timi
 * - Suggested prompts as clickable cards
 * - Helpful tips and guidelines
 *
 * @module components/chat/chat-welcome
 */

'use client'

import { Bot, Mail, Printer, Wifi, Lock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================================================
// Types
// ============================================================================

export interface ChatWelcomeProps {
  onPromptClick: (prompt: string) => void
  userName?: string
}

// ============================================================================
// Suggested Prompts
// ============================================================================

const SUGGESTED_PROMPTS = [
  {
    icon: Lock,
    text: 'How do I reset my password?',
    category: 'Account Access',
  },
  {
    icon: Printer,
    text: "My printer isn't working",
    category: 'Hardware',
  },
  {
    icon: Wifi,
    text: 'How to connect to VPN?',
    category: 'Network',
  },
  {
    icon: Mail,
    text: 'Email not syncing on my phone',
    category: 'Email',
  },
]

// ============================================================================
// Component
// ============================================================================

export function ChatWelcome({
  onPromptClick,
  userName,
}: ChatWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Timi Avatar */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          {/* Pulse Animation */}
          <span className="absolute -right-1 -top-1 flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <MessageSquare className="h-3 w-3 text-primary-foreground" />
            </span>
          </span>
        </div>

        {/* Welcome Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Hi{userName ? ` ${userName}` : ''}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            I&apos;m <span className="font-semibold text-foreground">Timi</span>,
            your AI-powered IT support assistant
          </p>
        </div>

        {/* Description */}
        <p className="max-w-md text-sm text-muted-foreground">
          I can help you with password resets, printer issues, network
          connectivity, email problems, and more. Just ask me anything!
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="w-full max-w-2xl space-y-4">
        <h2 className="text-center text-sm font-medium text-muted-foreground">
          Try asking about:
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {SUGGESTED_PROMPTS.map((prompt, index) => {
            const Icon = prompt.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto justify-start gap-3 p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                onClick={() => onPromptClick(prompt.text)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{prompt.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {prompt.category}
                  </span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="w-full max-w-2xl space-y-3 rounded-lg border border-border bg-muted/50 p-4">
        <h3 className="text-sm font-semibold">💡 Tips for better responses:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              Be specific about your issue (e.g., &quot;Can&apos;t log into Outlook on my
              laptop&quot;)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              Include any error messages you&apos;re seeing
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              Let me know what troubleshooting steps you&apos;ve already tried
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              If I can&apos;t solve your issue, I&apos;ll help you create a support ticket
            </span>
          </li>
        </ul>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground">
        All conversations are logged for quality assurance and training purposes
      </p>
    </div>
  )
}
