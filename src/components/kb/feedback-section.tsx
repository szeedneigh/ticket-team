/**
 * Feedback Section Component
 *
 * Client component for article voting (helpful/not helpful).
 * Includes optimistic UI updates and toast notifications.
 */

'use client'

import { useState, useTransition } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { voteArticle } from '@/lib/kb/actions'
import { toast } from 'sonner'
import type { ArticleVote } from '@/lib/types/knowledge-base'

interface FeedbackSectionProps {
  articleId: string
  helpfulVotes: number
  totalVotes: number
  userVote?: ArticleVote | null
}

export function FeedbackSection({
  articleId,
  helpfulVotes,
  totalVotes,
  userVote
}: FeedbackSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [localVote, setLocalVote] = useState<ArticleVote | null>(userVote || null)
  const [feedbackText, setFeedbackText] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const helpfulnessPercent = totalVotes > 0
    ? Math.round((helpfulVotes / totalVotes) * 100)
    : 0

  const handleVote = async (isHelpful: boolean) => {
    // Optimistic update
    setLocalVote({
      id: 'temp',
      article_id: articleId,
      user_id: 'temp',
      is_helpful: isHelpful,
      feedback_text: feedbackText || null,
      created_at: new Date().toISOString()
    })

    // Show feedback textarea if not helpful
    if (!isHelpful) {
      setShowFeedback(true)
      return
    }

    // Submit vote
    startTransition(async () => {
      const result = await voteArticle(articleId, isHelpful, feedbackText)

      if (result?.error) {
        toast.error(result.error)
        setLocalVote(userVote || null) // Revert on error
      } else {
        toast.success('Thank you for your feedback!')
      }
    })
  }

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      toast.error('Please provide feedback before submitting')
      return
    }

    startTransition(async () => {
      const result = await voteArticle(articleId, false, feedbackText)

      if (result?.error) {
        toast.error(result.error)
        setLocalVote(userVote || null) // Revert on error
      } else {
        toast.success('Thank you for your feedback!')
        setShowFeedback(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Was this article helpful?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vote Buttons */}
        {!localVote && (
          <div className="flex items-center gap-4">
            <Button
              onClick={() => handleVote(true)}
              disabled={isPending}
              variant="outline"
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Helpful
            </Button>
            <Button
              onClick={() => handleVote(false)}
              disabled={isPending}
              variant="outline"
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Not Helpful
            </Button>
          </div>
        )}

        {/* Feedback Textarea (shown when user clicks "Not Helpful") */}
        {showFeedback && !localVote && (
          <div className="space-y-2">
            <Textarea
              placeholder="How can we improve this article? (optional)"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitFeedback}
                disabled={isPending}
                className="flex-1"
              >
                Submit Feedback
              </Button>
              <Button
                onClick={() => {
                  setShowFeedback(false)
                  setFeedbackText('')
                }}
                variant="ghost"
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Vote Statistics */}
        {totalVotes > 0 && (
          <p className="text-sm text-muted-foreground">
            {helpfulVotes} out of {totalVotes} people found this helpful ({helpfulnessPercent}%)
          </p>
        )}

        {/* Thank You Message */}
        {localVote && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <span>✓</span>
            <span>Thank you for your feedback!</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
