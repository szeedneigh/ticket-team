'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { SATISFACTION_EMOJIS } from '@/lib/constants/satisfaction-emojis'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { submitTicketFeedback } from '@/app/actions/feedback'

/**
 * Feedback Prompt Component
 *
 * Displays a dialog prompting users to rate their satisfaction
 * after a ticket is resolved. Features:
 * - 5-level emoji rating (😢 → 😍)
 * - Optional comment field
 * - Prevents duplicate submissions
 */

interface FeedbackPromptProps {
  ticketId: string
  ticketTitle: string
  isOpen: boolean
  onClose: () => void
  onSubmitted?: () => void
  /** When true, user cannot skip or close without submitting */
  mandatory?: boolean
}

export function FeedbackPrompt({
  ticketId,
  ticketTitle,
  isOpen,
  onClose,
  onSubmitted,
  mandatory = false,
}: FeedbackPromptProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await submitTicketFeedback({
        ticketId,
        rating,
        comment: comment.trim() || undefined,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to submit feedback')
        return
      }

      toast.success('Thank you for your feedback!')

      // Reset form
      setRating(0)
      setComment('')

      // Call optional callback
      if (onSubmitted) {
        onSubmitted()
      }

      // Close dialog
      onClose()
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (mandatory && !open) {
      // Prevent close - user must submit
      return
    }
    if (!isSubmitting) {
      setRating(0)
      setComment('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={!mandatory}
        onInteractOutside={mandatory ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={mandatory ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>How was your experience?</DialogTitle>
          <DialogDescription>
            Your ticket &quot;{ticketTitle}&quot; has been resolved. Please rate your
            satisfaction with the resolution.
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Note: Your rating cannot be changed after submission to ensure data integrity for analytics.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Emoji Rating */}
          <div className="space-y-2">
            <Label className="text-center block">Rate your satisfaction</Label>
            <div className="flex items-center justify-center gap-2">
              {([1, 2, 3, 4, 5] as const).map((level) => {
                const emoji = SATISFACTION_EMOJIS[level]
                const active = level <= (hoveredRating || rating)
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRating(level)}
                    onMouseEnter={() => setHoveredRating(level)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={`text-4xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1 ${
                      active ? 'opacity-100 scale-100' : 'opacity-40'
                    }`}
                    disabled={isSubmitting}
                  >
                    {emoji}
                    <span className="sr-only">Rating {level} of 5</span>
                  </button>
                )
              })}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && 'Very Dissatisfied'}
                {rating === 2 && 'Dissatisfied'}
                {rating === 3 && 'Neutral'}
                {rating === 4 && 'Satisfied'}
                {rating === 5 && 'Very Satisfied'}
              </p>
            )}
          </div>

          {/* Optional Comment */}
          <div className="space-y-2">
            <Label htmlFor="feedback-comment">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="feedback-comment"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!mandatory && (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Skip for Now
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
