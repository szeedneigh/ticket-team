/**
 * TicketReviewModal Component
 *
 * Modal for reviewing and editing ticket data before creation:
 * - Pre-filled editable form
 * - AI-suggested title (editable)
 * - Auto-detected category with confidence indicator
 * - Suggested priority
 * - Smart staff assignment with reasoning
 * - Expandable description preview
 * - Optional user additions field
 * - Real-time validation
 *
 * @module components/chat/ticket-review-modal
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Loader2,
  TrendingUp,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TicketPreparation } from '@/lib/chat/escalation-utils'

// ============================================================================
// Types
// ============================================================================

export interface TicketReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preparation: TicketPreparation | null
  isLoading: boolean
  onSubmit: (data: {
    title: string
    description: string
    category: string
    priority: 'low' | 'medium' | 'high'
    assignedTo?: string
    userAdditions?: string
  }) => Promise<void>
  availableCategories?: string[]
  availableStaff?: Array<{ id: string; name: string; department: string }>
}

// ============================================================================
// Component
// ============================================================================

export function TicketReviewModal({
  open,
  onOpenChange,
  preparation,
  isLoading,
  onSubmit,
  availableCategories = [],
  availableStaff = [],
}: TicketReviewModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [userAdditions, setUserAdditions] = useState('')
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Initialize form with preparation data
  useEffect(() => {
    if (preparation) {
      setTitle(preparation.suggestedTitle)
      setCategory(preparation.suggestedCategory)
      setPriority(preparation.suggestedPriority)
      setAssignedTo(preparation.suggestedStaff?.staffId || '')
      setUserAdditions('')
      setValidationError(null)
    }
  }, [preparation])

  // Form validation
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Title is required')
      return false
    }

    if (title.length < 5) {
      setValidationError('Title must be at least 5 characters')
      return false
    }

    if (!category) {
      setValidationError('Category is required')
      return false
    }

    setValidationError(null)
    return true
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!preparation || !validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        description: preparation.suggestedDescription,
        category,
        priority,
        assignedTo: assignedTo || undefined,
        userAdditions: userAdditions.trim() || undefined,
      })

      // Close modal on success
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create ticket:', error)
      setValidationError('Failed to create ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-500'
    if (confidence >= 0.6) return 'text-blue-600 dark:text-blue-500'
    return 'text-yellow-600 dark:text-yellow-500'
  }

  // Get confidence badge variant
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8)
      return (
        <Badge variant="outline" className="gap-1 border-green-600/50 text-green-600 dark:text-green-500">
          <CheckCircle2 className="h-3 w-3" />
          High Confidence
        </Badge>
      )
    if (confidence >= 0.6)
      return (
        <Badge variant="outline" className="gap-1 border-blue-600/50 text-blue-600 dark:text-blue-500">
          <TrendingUp className="h-3 w-3" />
          Medium Confidence
        </Badge>
      )
    return (
      <Badge variant="outline" className="gap-1 border-yellow-600/50 text-yellow-600 dark:text-yellow-500">
        <AlertCircle className="h-3 w-3" />
        Please Verify
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Support Ticket
          </DialogTitle>
          <DialogDescription>
            Review and edit the details below. We&apos;ve pre-filled everything based on
            your conversation with Timi.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !preparation ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="ticket-title" className="flex items-center gap-2">
                  Title
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-generated
                  </Badge>
                </Label>
                <Input
                  id="ticket-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Make it clear and specific for the support team
                </p>
              </div>

              {/* Category Field */}
              <div className="space-y-2">
                <Label htmlFor="ticket-category" className="flex items-center gap-2">
                  Category
                  {getConfidenceBadge(preparation.categoryConfidence)}
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="ticket-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableCategories.length > 0
                      ? availableCategories
                      : [
                          'Account Access',
                          'Network',
                          'Email',
                          'Hardware',
                          'Software',
                          'General',
                        ]
                    ).map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    getConfidenceColor(preparation.categoryConfidence)
                  )}
                >
                  <TrendingUp className="h-3 w-3" />
                  {(preparation.categoryConfidence * 100).toFixed(0)}% confidence
                  {preparation.categoryConfidence < 0.7 &&
                    ' - Please verify this category'}
                </p>
              </div>

              {/* Priority Field */}
              <div className="space-y-2">
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={value =>
                    setPriority(value as 'low' | 'medium' | 'high')
                  }
                >
                  <SelectTrigger id="ticket-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Assignment */}
              {preparation.suggestedStaff && (
                <div className="space-y-2">
                  <Label htmlFor="ticket-staff" className="flex items-center gap-2">
                    Assigned To
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Suggested
                    </Badge>
                  </Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger id="ticket-staff">
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-assign</SelectItem>
                      {availableStaff.length > 0 ? (
                        availableStaff.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} - {staff.department}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={preparation.suggestedStaff.staffId}>
                          {preparation.suggestedStaff.staffName}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {preparation.suggestedStaff && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                      <p className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-primary" />
                        {preparation.suggestedStaff.staffName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {preparation.suggestedStaff.reason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Description Preview */}
              <div className="space-y-2">
                <Collapsible
                  open={descriptionExpanded}
                  onOpenChange={setDescriptionExpanded}
                >
                  <div className="flex items-center justify-between">
                    <Label>Description Preview</Label>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        {descriptionExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="mt-2 rounded-lg border border-border bg-muted/50 p-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-xs">
                          {preparation.suggestedDescription.substring(0, 500)}
                          {preparation.suggestedDescription.length > 500 && '...'}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Full conversation history will be included in the ticket
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* User Additions */}
              <div className="space-y-2">
                <Label htmlFor="user-additions">
                  Additional Context (Optional)
                </Label>
                <Textarea
                  id="user-additions"
                  value={userAdditions}
                  onChange={e => setUserAdditions(e.target.value)}
                  placeholder="Add any additional details that weren't covered in the chat..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This will be added to the top of the ticket description
                </p>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {validationError}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || !preparation}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Ticket...
              </>
            ) : (
              'Create Ticket'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
