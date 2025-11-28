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

import Image from 'next/image'
import { motion } from 'framer-motion'
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2cafdd]/20 to-[#1f3463]/10 border-2 border-[#2cafdd]/30 shadow-[0_0_20px_rgba(44,175,221,0.2)]">
            <Image
              src="/assets/timi-bot1.svg"
              alt="Timi AI Assistant"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              priority
            />
          </div>
          {/* Pulse Animation */}
          <span className="absolute -right-1 -top-1 flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2cafdd] opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2cafdd]">
              <MessageSquare className="h-3 w-3 text-white" />
            </span>
          </span>
        </motion.div>

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
                className="h-auto w-full justify-start gap-3 p-4 text-left transition-colors hover:border-[#2cafdd] hover:bg-[#2cafdd]/5"
                onClick={() => onPromptClick(prompt.text)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2cafdd]/20 to-[#1f3463]/10">
                  <Icon className="h-5 w-5 text-[#2cafdd]" />
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
