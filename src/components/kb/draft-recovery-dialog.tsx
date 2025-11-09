/**
 * Draft Recovery Dialog Component
 *
 * Prompts users to recover unsaved drafts when they return to the editor.
 * Allows users to restore, discard, or keep both versions.
 */

'use client'

import { useState, useEffect } from 'react'
import { FileText, Trash2, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface DraftData {
  title?: string
  content?: string
  summary?: string | null
  category?: string
  subcategory?: string | null
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  source_ticket_id?: string | null
  savedAt: string
}

interface DraftRecoveryDialogProps {
  storageKey: string
  onRecover: (data: DraftData) => void
  onDiscard: () => void
  currentData?: Partial<DraftData>
}

export function DraftRecoveryDialog({
  storageKey,
  onRecover,
  onDiscard,
  currentData
}: DraftRecoveryDialogProps) {
  const [open, setOpen] = useState(false)
  const [draftData, setDraftData] = useState<DraftData | null>(null)

  useEffect(() => {
    // Check for saved draft on mount
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed: DraftData = JSON.parse(saved)

        // Only show dialog if draft has meaningful content
        const hasContent =
          parsed.title ||
          (parsed.content && parsed.content.length > 50) ||
          (parsed.tags && parsed.tags.length > 0)

        if (hasContent) {
          // Check if current data is different from saved draft
          const isDifferent =
            !currentData ||
            parsed.title !== currentData.title ||
            parsed.content !== currentData.content

          if (isDifferent) {
            setDraftData(parsed)
            setOpen(true)
          }
        } else {
          // Clean up empty drafts
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
      localStorage.removeItem(storageKey)
    }
  }, [storageKey, currentData])

  const handleRecover = () => {
    if (draftData) {
      onRecover(draftData)
      setOpen(false)
    }
  }

  const handleDiscard = () => {
    localStorage.removeItem(storageKey)
    onDiscard()
    setOpen(false)
  }

  if (!draftData) return null

  const savedDate = new Date(draftData.savedAt)
  const timeAgo = formatDistanceToNow(savedDate, { addSuffix: true })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Unsaved Draft Found</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            We found an unsaved draft from {timeAgo}. Would you like to recover it?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Draft Preview */}
        <div className="space-y-4 py-4">
          {/* Title */}
          {draftData.title && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Title</p>
              <p className="text-sm font-semibold">{draftData.title}</p>
            </div>
          )}

          {/* Category */}
          {draftData.category && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <Badge variant="outline">{draftData.category}</Badge>
            </div>
          )}

          {/* Tags */}
          {draftData.tags && draftData.tags.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-2">
                {draftData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview */}
          {draftData.content && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Content Preview</p>
              <div className="rounded-md border bg-muted/50 p-3 text-sm max-h-32 overflow-y-auto">
                <div
                  className="prose prose-sm dark:prose-invert line-clamp-4"
                  dangerouslySetInnerHTML={{
                    __html: draftData.content.slice(0, 500)
                  }}
                />
                {draftData.content.length > 500 && (
                  <p className="text-muted-foreground mt-2">
                    ... and {draftData.content.length - 500} more characters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            Last saved: {savedDate.toLocaleString()}
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            className="sm:order-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Discard Draft
          </Button>
          <AlertDialogCancel className="sm:order-2">
            Keep Editing
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRecover} className="sm:order-3">
            <Download className="h-4 w-4 mr-2" />
            Recover Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
