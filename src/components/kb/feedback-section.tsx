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
    <div className="space-y-5">
      {/* Vote Buttons */}
      {!localVote && (
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => handleVote(true)}
            disabled={isPending}
            variant="outline"
            className="flex-1 max-w-[200px] h-12 gap-2.5 bg-background/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 group"
          >
            <ThumbsUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Helpful</span>
          </Button>
          <Button
            onClick={() => handleVote(false)}
            disabled={isPending}
            variant="outline"
            className="flex-1 max-w-[200px] h-12 gap-2.5 bg-background/50 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 group"
          >
            <ThumbsDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Not Helpful</span>
          </Button>
        </div>
      )}

      {/* Feedback Textarea (shown when user clicks "Not Helpful") */}
      {showFeedback && !localVote && (
        <div className="space-y-3 mt-4 max-w-lg mx-auto">
          <Textarea
            placeholder="How can we improve this article?"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowFeedback(false)
                setFeedbackText('')
              }}
              variant="ghost"
              disabled={isPending}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={isPending}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      )}

      {/* Vote Statistics */}
      {totalVotes > 0 && !localVote && (
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{helpfulVotes}</span> out of{' '}
          <span className="font-medium text-foreground">{totalVotes}</span> people found this helpful
          <span className="text-primary ml-1">({helpfulnessPercent}%)</span>
        </p>
      )}

      {/* Thank You Message */}
      {localVote && (
        <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Thank you for your feedback!</span>
        </div>
      )}
    </div>
  )
}
