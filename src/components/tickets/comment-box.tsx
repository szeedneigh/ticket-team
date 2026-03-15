'use client'

import { useState, useTransition } from 'react'
import { Loader2, Send, Lock, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createComment } from '@/app/actions/comments'
import { COMMENT_MAX_LENGTH } from '@/lib/validations/comments'
import { CannedResponsePicker } from './canned-response-picker'

/**
 * Comment Box Component
 *
 * Input form for adding comments to tickets.
 * Features:
 * - Text area with character counter
 * - Internal note checkbox (staff only)
 * - File attachment support (up to 5 files)
 * - Loading states
 * - Success/error feedback
 */

interface CommentBoxProps {
  ticketId: string
  isStaff: boolean
}

interface SelectedFile {
  file: File
  preview: string
}

export function CommentBox({ ticketId, isStaff }: CommentBoxProps) {
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isPending, startTransition] = useTransition()

  const characterCount = content.length
  const isOverLimit = characterCount > COMMENT_MAX_LENGTH
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isPending

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 files
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files per comment')
      return
    }

    const newFiles = files.map((file) => ({
      file,
      preview: file.name,
    }))

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  // Remove file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('ticket_id', ticketId)
      formData.append('content', content.trim())
      formData.append('is_internal', isInternal.toString())
      formData.append('file_count', selectedFiles.length.toString())

      selectedFiles.forEach((sf, index) => {
        formData.append(`file_${index}`, sf.file)
      })

      const result = await createComment(formData)

      if (result.success) {
        toast.success(isInternal ? 'Internal note added' : 'Comment added')
        setContent('')
        setIsInternal(false)
        setSelectedFiles([])
      } else {
        toast.error(result.error || 'Failed to add comment')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Area */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isStaff && isInternal
              ? 'Add an internal note (only visible to staff)...'
              : 'Add a comment...'
          }
          className="min-h-[100px] resize-none"
          disabled={isPending}
        />

        {/* Character Counter */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span
            className={
              isOverLimit
                ? 'text-destructive font-medium'
                : characterCount > COMMENT_MAX_LENGTH * 0.9
                  ? 'text-amber-600'
                  : ''
            }
          >
            {characterCount} / {COMMENT_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* File Attachments */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Attachments</Label>
          <div className="space-y-1">
            {selectedFiles.map((sf, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 bg-muted rounded px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm truncate">
                  <Paperclip className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sf.file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(sf.file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Internal Note Checkbox + File Button */}
        <div className="flex items-center gap-4">
          {/* Internal Note Toggle (Staff Only) */}
          {isStaff && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked === true)}
                disabled={isPending}
              />
              <Label
                htmlFor="is_internal"
                className="text-sm font-normal cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Internal note
              </Label>
            </div>
          )}

          {/* File Upload */}
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || selectedFiles.length >= 5}
              asChild
            >
              <span>
                <Paperclip className="w-4 h-4 mr-2" />
                Attach
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={isPending || selectedFiles.length >= 5}
              className="sr-only"
            />
          </Label>

          {/* Canned Response Picker (Staff Only) */}
          {isStaff && (
            <CannedResponsePicker
              onSelect={(text) => {
                setContent((prev) => (prev.trim() ? `${prev}\n\n${text}` : text))
              }}
              disabled={isPending}
            />
          )}
        </div>

        {/* Right: Submit Button */}
        <Button type="submit" disabled={!canSubmit} size="sm">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isInternal ? 'Add Note' : 'Comment'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
