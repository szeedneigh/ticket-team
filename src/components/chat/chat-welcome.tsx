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
import { Mail, Printer, Wifi, Lock, MessageSquare } from 'lucide-react'
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
    <div className="h-full w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-6">
      {/* Header - More Compact */}
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Timi Avatar - Smaller */}
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
          className="relative h-16 w-16"
        >
          {/* Multi-layer breathing pulse background */}
          <motion.div
            className="absolute inset-0 rounded-full bg-[#2cafdd]/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-[#1f3463]/10"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          <Image
            src="/assets/timi-bot1.svg"
            alt="Timi AI Assistant"
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(44,175,221,0.5)]"
            priority
          />
          {/* Enhanced Pulse Animation with double ring */}
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2cafdd] opacity-75" style={{ animationDuration: '2s' }} />
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2cafdd] opacity-50" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2cafdd] animate-pulse">
              <MessageSquare className="h-2.5 w-2.5 text-white" />
            </span>
          </span>
        </motion.div>

        {/* Welcome Text - Smaller */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#1f3463] to-[#2cafdd] bg-clip-text text-transparent">
            Hi{userName ? ` ${userName}` : ''}! 👋
          </h1>
          <p className="text-base text-muted-foreground">
            I&apos;m <span className="font-semibold text-foreground">Timi</span>,
            your AI-powered IT support assistant
          </p>
        </div>

        {/* Description - Removed to save space */}
      </div>

      {/* Suggested Prompts - More Prominent */}
      <div className="w-full max-w-2xl space-y-3">
        <h2 className="text-center text-sm font-medium text-muted-foreground">
          Try asking about:
        </h2>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {SUGGESTED_PROMPTS.map((prompt, index) => {
            const Icon = prompt.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto w-full justify-start gap-2.5 p-3 text-left transition-all hover:border-[#2cafdd]/50 hover:bg-[#2cafdd]/5 hover:shadow-md hover:-translate-y-0.5"
                onClick={() => onPromptClick(prompt.text)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2cafdd]/20 to-[#1f3463]/10 text-[#2cafdd]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{prompt.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {prompt.category}
                  </span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Tips - Compact */}
      <div className="w-full max-w-2xl rounded-lg border border-border bg-muted/50 p-3">
        <h3 className="text-xs font-semibold mb-2">💡 Tips for better responses:</h3>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>Be specific about your issue</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>Include error messages if available</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>I can help create a support ticket if needed</span>
          </li>
        </ul>
      </div>
      </div>
    </div>
  )
}
