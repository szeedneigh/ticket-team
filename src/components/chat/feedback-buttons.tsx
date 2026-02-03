/**
 * FeedbackButtons Component
 *
 * Thumbs up/down buttons for AI message feedback:
 * - Displays below each AI message
 * - Records feedback in database
 * - Shows feedback state (helpful, not helpful, none)
 * - Optional text feedback on thumbs down
 *
 * @module components/chat/feedback-buttons
 */

'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { submitFeedback } from '@/app/actions/chat'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface FeedbackButtonsProps {
  interactionId: string
  initialFeedback?: boolean | null
  onFeedbackChange?: (wasHelpful: boolean) => void
}

// ============================================================================
// Component
// ============================================================================

export function FeedbackButtons({
  interactionId,
  initialFeedback = null,
  onFeedbackChange,
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<boolean | null>(initialFeedback)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Handle feedback submission
  const handleFeedback = async (wasHelpful: boolean, text?: string) => {
    setIsSubmitting(true)

    try {
      const result = await submitFeedback({
        interactionId,
        wasHelpful,
        feedbackText: text,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to submit feedback')
        return
      }

      setFeedback(wasHelpful)
      onFeedbackChange?.(wasHelpful)

      toast.success(
        wasHelpful
          ? 'Thanks for your feedback!'
          : 'Thanks for letting us know. We\'ll work to improve.'
      )

      // Close popover if open
      setPopoverOpen(false)
      setFeedbackText('')
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle thumbs up
  const handleThumbsUp = () => {
    if (feedback === true) {
      return // Already marked as helpful
    }
    handleFeedback(true)
  }

  // Handle thumbs down with optional text
  const handleThumbsDown = (text?: string) => {
    if (feedback === false && !text) {
      return // Already marked as not helpful
    }
    handleFeedback(false, text)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Rate this response</span>

      {/* Like (Thumbs Up) Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7',
          feedback === true && 'bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700 dark:bg-green-950 dark:text-green-400'
        )}
        onClick={handleThumbsUp}
        disabled={isSubmitting || feedback === true}
        aria-label="Like"
      >
        {isSubmitting && feedback === null ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ThumbsUp
            className={cn(
              'h-3.5 w-3.5',
              feedback === true && 'fill-current'
            )}
          />
        )}
      </Button>

      {/* Thumbs Down Button with Popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              feedback === false && 'bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700 dark:bg-red-950 dark:text-red-400'
            )}
            disabled={isSubmitting}
            aria-label="Mark as not helpful"
          >
            {isSubmitting && feedback === null ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ThumbsDown
                className={cn(
                  'h-3.5 w-3.5',
                  feedback === false && 'fill-current'
                )}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-text">
                What could be improved? (Optional)
              </Label>
              <Textarea
                id="feedback-text"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Let us know how we can do better..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPopoverOpen(false)
                  setFeedbackText('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleThumbsDown(feedbackText)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Feedback State Indicator */}
      {feedback !== null && (
        <span className="text-xs text-muted-foreground">
          {feedback ? 'Liked' : 'Disliked'}
        </span>
      )}
    </div>
  )
}
