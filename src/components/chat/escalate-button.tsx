/**
 * EscalateButton Component
 *
 * Button that triggers the ticket escalation modal.
 * Shown when:
 * - AI explicitly suggests escalation
 * - User feedback is "not helpful"
 * - No KB articles found with high similarity
 *
 * @module components/chat/escalate-button
 */

'use client'

import { Ticket, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface EscalateButtonProps {
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function EscalateButton({
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
  children,
}: EscalateButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn('gap-2', className)}
      aria-label="Create support ticket from this conversation"
    >
      <Ticket className="h-4 w-4" />
      {children || 'Create Support Ticket'}
      <ArrowRight className="h-4 w-4" />
    </Button>
  )
}
