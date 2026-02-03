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
import { TICKET_PRIORITY_LABELS, type TicketPriority } from '@/lib/types/database'
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
    priority: TicketPriority
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
  const [priority, setPriority] = useState<TicketPriority>('medium')
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
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 border-b border-border/60 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>Create Support Ticket</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review the ticket details below, then send it to the support team.
            </DialogDescription>
          </DialogHeader>

          {isLoading || !preparation ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(90vh-220px)] pr-4">
              <div className="space-y-8">
                {/* Title Field */}
                <section className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label
                      htmlFor="ticket-title"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      Title
                      <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px]">
                        <Sparkles className="h-3 w-3" />
                        AI-generated
                      </Badge>
                    </Label>
                  </div>
                  <Input
                    id="ticket-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="text-sm sm:text-base"
                  />
                </section>

                {/* Category & Priority */}
                <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <Label
                        htmlFor="ticket-category"
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        Category
                        {getConfidenceBadge(preparation.categoryConfidence)}
                      </Label>
                    </div>
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
                        'inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium',
                        getConfidenceColor(preparation.categoryConfidence)
                      )}
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span>
                        {(preparation.categoryConfidence * 100).toFixed(0)}% confidence
                        {preparation.categoryConfidence < 0.7 &&
                          ' • Please double-check this category'}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="ticket-priority"
                      className="text-sm font-medium"
                    >
                      Priority
                    </Label>
                    <Select
                      value={priority}
                      onValueChange={value =>
                        setPriority(value as TicketPriority)
                      }
                    >
                      <SelectTrigger id="ticket-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{TICKET_PRIORITY_LABELS.low}</SelectItem>
                        <SelectItem value="medium">{TICKET_PRIORITY_LABELS.medium}</SelectItem>
                        <SelectItem value="high">{TICKET_PRIORITY_LABELS.high}</SelectItem>
                        <SelectItem value="urgent">{TICKET_PRIORITY_LABELS.urgent}</SelectItem>
                        <SelectItem value="critical">{TICKET_PRIORITY_LABELS.critical}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                {/* Staff Assignment */}
                {preparation.suggestedStaff && (
                  <section className="space-y-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <Label
                        htmlFor="ticket-staff"
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        Assigned To
                        <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px]">
                          <Sparkles className="h-3 w-3" />
                          Suggested
                        </Badge>
                      </Label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger id="ticket-staff">
                          <SelectValue placeholder="Auto-assign to the right team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Auto-assign</SelectItem>
                          {availableStaff.length > 0 ? (
                            availableStaff.map(staff => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} • {staff.department}
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
                        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm shadow-[0_0_0_1px_rgba(15,23,42,0.02)] dark:shadow-none">
                          <p className="flex items-center gap-2 font-medium">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-4 w-4" />
                            </span>
                            <span className="truncate">
                              {preparation.suggestedStaff.staffName}
                            </span>
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {preparation.suggestedStaff.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Description Preview */}
                <section className="space-y-3">
                  <Collapsible
                    open={descriptionExpanded}
                    onOpenChange={setDescriptionExpanded}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Description Preview
                        </Label>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 px-3 text-xs"
                        >
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
                      <div className="mt-3 rounded-lg border border-border bg-muted/60 p-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {preparation.suggestedDescription.substring(0, 500)}
                            {preparation.suggestedDescription.length > 500 && '...'}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </section>

                {/* User Additions */}
                <section className="space-y-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="user-additions"
                      className="text-sm font-medium"
                    >
                      Additional Context (Optional)
                    </Label>
                  </div>
                  <Textarea
                    id="user-additions"
                    value={userAdditions}
                    onChange={e => setUserAdditions(e.target.value)}
                    placeholder="Add any extra details you want the team to see first."
                    rows={4}
                    className="resize-none text-sm leading-relaxed"
                  />
                </section>

                {/* Validation Error */}
                {validationError && (
                  <section>
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{validationError}</p>
                    </div>
                  </section>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-between sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading || !preparation}
              aria-busy={isSubmitting}
              className="w-full sm:w-auto"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
