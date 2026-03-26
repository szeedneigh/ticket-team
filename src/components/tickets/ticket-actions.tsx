'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Loader2, RotateCcw, User, Tag, CheckCircle, BookOpen, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { TicketWithUser } from '@/lib/types/tickets'
import type { User as UserType } from '@/lib/types/users'
import type { TicketStatus, TicketPriority } from '@/lib/types/database'
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/types/database'
import {
  updateTicketStatus,
  assignTicket,
  updateTicketPriority,
  reopenTicket,
  updateTicketDueDate,
} from '@/app/actions/tickets'
import { getDueDateUrgency, dueDateUrgencyClass } from '@/lib/tickets/due-date'
import { SUCCESS_MESSAGES } from '@/lib/constants'

/**
 * Ticket Actions Component
 *
 * Staff-only component for managing tickets.
 * Features:
 * - Status change dropdown
 * - Assignment dropdown
 * - Priority change
 * - Reopen ticket (with justification)
 * - Add resolution notes
 */

interface TicketActionsProps {
  ticket: TicketWithUser
  staffUsers: UserType[]
  currentUserId: string
  isStaff: boolean
  isSubmitter: boolean
  /** Staff-only: whether the submitter has submitted satisfaction feedback (for close flow notice) */
  submitterHasFeedback?: boolean
}

export function TicketActions({
  ticket,
  staffUsers,
  currentUserId,
  isStaff,
  isSubmitter,
  submitterHasFeedback = false,
}: TicketActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  // Confirmation States
  const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [confirmAssignDialogOpen, setConfirmAssignDialogOpen] = useState(false)
  const [pendingAssignee, setPendingAssignee] = useState<string | null>(null)

  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closeNotes, setCloseNotes] = useState('')
  const [closeConfirmed, setCloseConfirmed] = useState(false)

  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false)
  const [dueDateInput, setDueDateInput] = useState('')

  // ============================================================================
  // Status Change Handler
  // ============================================================================

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === ticket.status) return

    if (newStatus === 'resolved') {
      setResolutionNotes('')
      setResolveDialogOpen(true)
      return
    }

    if (newStatus === 'closed') {
      setCloseNotes('')
      setCloseConfirmed(false)
      setCloseDialogOpen(true)
      return
    }

    setPendingStatus(newStatus)
    setConfirmStatusDialogOpen(true)
  }

  const confirmClose = () => {
    if (!closeConfirmed) {
      toast.error('Please confirm that the issue has been verified as resolved')
      return
    }

    startTransition(async () => {
      const result = await updateTicketStatus(
        ticket.id,
        'closed',
        undefined,
        closeNotes.trim() || undefined
      )

      if (result.success) {
        toast.success(SUCCESS_MESSAGES.TICKET_CLOSED)
        setCloseDialogOpen(false)
        setCloseNotes('')
        setCloseConfirmed(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to close ticket')
      }
    })
  }

  const openDueDateDialog = () => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const base = ticket.due_date ? new Date(ticket.due_date) : new Date(Date.now() + 24 * 3600 * 1000)
    setDueDateInput(
      `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`
    )
    setDueDateDialogOpen(true)
  }

  const saveManualDueDate = () => {
    if (!dueDateInput) {
      toast.error('Please choose a due date')
      return
    }
    startTransition(async () => {
      const result = await updateTicketDueDate(
        ticket.id,
        'manual',
        new Date(dueDateInput).toISOString()
      )
      if (result.success) {
        toast.success('Due date updated')
        setDueDateDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update due date')
      }
    })
  }

  const resetDueDateToSla = () => {
    startTransition(async () => {
      const result = await updateTicketDueDate(ticket.id, 'reset')
      if (result.success) {
        toast.success('Due date reset to SLA')
        setDueDateDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reset due date')
      }
    })
  }

  const activeForDueDate =
    ticket.status === 'open' ||
    ticket.status === 'in_progress' ||
    ticket.status === 'on_hold'
  const dueUrgency = getDueDateUrgency(ticket.due_date, ticket.status)

  const confirmStatusChange = () => {
    if (!pendingStatus) return

    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, pendingStatus as TicketStatus)

      if (result.success) {
        const message =
          pendingStatus === 'closed'
            ? SUCCESS_MESSAGES.TICKET_CLOSED
            : pendingStatus === 'canceled'
              ? SUCCESS_MESSAGES.TICKET_CANCELED
              : SUCCESS_MESSAGES.TICKET_UPDATED
        toast.success(message)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
      setConfirmStatusDialogOpen(false)
      setPendingStatus(null)
    })
  }

  const handleResolve = () => {
    startTransition(async () => {
      const result = await updateTicketStatus(
        ticket.id,
        'resolved' as TicketStatus,
        resolutionNotes
      )

      if (result.success) {
        toast.success(SUCCESS_MESSAGES.TICKET_RESOLVED)
        setResolveDialogOpen(false)
        setResolutionNotes('')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    })
  }

  // ============================================================================
  // Assignment Handler
  // ============================================================================

  const handleAssignment = (userId: string) => {
    if (userId === (ticket.assigned_to || '')) return
    
    setPendingAssignee(userId)
    setConfirmAssignDialogOpen(true)
  }

  const confirmAssignment = () => {
    if (!pendingAssignee) return

    startTransition(async () => {
      const result = await assignTicket(ticket.id, pendingAssignee)

      if (result.success) {
        toast.success('Ticket assigned successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to assign ticket')
      }
      setConfirmAssignDialogOpen(false)
      setPendingAssignee(null)
    })
  }

  // ============================================================================
  // Priority Change Handler
  // ============================================================================

  const handlePriorityChange = (newPriority: string) => {
    if (newPriority === ticket.priority) return

    startTransition(async () => {
      const result = await updateTicketPriority(ticket.id, newPriority as TicketPriority)

      if (result.success) {
        toast.success('Priority updated successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update priority')
      }
    })
  }

  // ============================================================================
  // Reopen Ticket Handler
  // ============================================================================

  const handleReopen = () => {
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening')
      return
    }

    startTransition(async () => {
      const result = await reopenTicket(ticket.id, reopenReason)

      if (result.success) {
        toast.success(SUCCESS_MESSAGES.TICKET_REOPENED)
        setReopenDialogOpen(false)
        setReopenReason('')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reopen ticket')
      }
    })
  }

  // ============================================================================
  // Reopen Button Visibility
  // ============================================================================

  const canReopen =
    (isSubmitter || isStaff) &&
    (ticket.status === 'resolved' || ticket.status === 'closed')

  const canCreateKB =
    isStaff &&
    (ticket.status === 'resolved' || ticket.status === 'closed')

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl sticky top-6">
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f3463] via-[#2cafdd] to-[#1f3463]" />
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            ⚙️ Ticket Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Change (Staff Only) */}
          {isStaff && (
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </Label>
              <Select
                value={ticket.status}
                onValueChange={handleStatusChange}
                disabled={isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Active Statuses */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Active
                  </div>
                  <SelectItem value="open">{TICKET_STATUS_LABELS.open} - New ticket</SelectItem>
                  <SelectItem value="in_progress">{TICKET_STATUS_LABELS.in_progress} - Staff working on it</SelectItem>
                  <SelectItem value="on_hold">{TICKET_STATUS_LABELS.on_hold} - Waiting for something</SelectItem>
                  <Separator className="my-1" />
                  {/* Completed Statuses */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Completed
                  </div>
                  <SelectItem value="resolved">{TICKET_STATUS_LABELS.resolved} - Fixed, awaiting confirmation</SelectItem>
                  <SelectItem value="closed">{TICKET_STATUS_LABELS.closed} - Confirmed by user</SelectItem>
                  <Separator className="my-1" />
                  {/* Cancelled */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Cancelled
                  </div>
                  <SelectItem value="canceled">{TICKET_STATUS_LABELS.canceled} - No longer needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignment (Staff Only) */}
          {isStaff && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To
              </Label>
              <Select
                value={ticket.assigned_to || 'unassigned'}
                onValueChange={handleAssignment}
                disabled={isPending}
              >
                <SelectTrigger id="assigned_to">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value={currentUserId}>Assign to Me</SelectItem>
                  <Separator className="my-2" />
                  {staffUsers
                    .filter((user) => user.id !== currentUserId)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                        {user.department && ` (${user.department})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority (Staff Only) */}
          {isStaff && (
            <div className="space-y-2">
              <Label htmlFor="priority" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Priority
              </Label>
              <Select
                value={ticket.priority}
                onValueChange={handlePriorityChange}
                disabled={isPending}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
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
          )}

          {/* Due date (Staff, active tickets) */}
          {isStaff && activeForDueDate && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Due date
                </Label>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                  {ticket.due_date ? (
                    <p className={dueDateUrgencyClass(dueUrgency)}>
                      {format(new Date(ticket.due_date), 'MMM d, yyyy h:mm a')}
                      {ticket.due_date_manual ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (manual)
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Not set</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openDueDateDialog}
                      disabled={isPending}
                    >
                      Adjust
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetDueDateToSla}
                      disabled={isPending}
                    >
                      Reset to SLA
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Create KB Article (Staff, resolved/closed only) */}
          {canCreateKB && (
            <>
              <Separator />
              <Button asChild variant="outline" className="w-full" disabled={isPending}>
                <Link href={`/kb/new/from-ticket/${ticket.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create KB Article
                </Link>
              </Button>
            </>
          )}

          {/* Reopen Button */}
          {canReopen && (
            <>
              {isStaff && <Separator />}
              <Button
                onClick={() => setReopenDialogOpen(true)}
                variant="outline"
                className="w-full"
                disabled={isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reopen Ticket
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Provide a summary of how this ticket was resolved. This helps with documentation and future reference.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="resolution-notes">Resolution Notes</Label>
            <Textarea
              id="resolution-notes"
              placeholder="Describe the solution, steps taken, or outcome..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              May be required depending on system configuration
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false)
                setResolutionNotes('')
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleResolve}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close ticket (dedicated confirmation) */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Close ticket</DialogTitle>
            <DialogDescription>
              Closing marks this ticket as fully completed and verified. This should be used when the
              resolution has been confirmed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {ticket.status === 'resolved' && !submitterHasFeedback && (
              <p className="text-sm text-amber-700 dark:text-amber-300 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                The submitter has not yet submitted satisfaction feedback for this resolved ticket.
              </p>
            )}

            {ticket.resolution_notes ? (
              <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-1">Resolution notes</p>
                <p className="whitespace-pre-wrap">{ticket.resolution_notes}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="closing-notes">Closing notes (optional)</Label>
              <Textarea
                id="closing-notes"
                placeholder="Any final notes for the record..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <Checkbox
                id="close-confirmed"
                checked={closeConfirmed}
                onCheckedChange={(v) => setCloseConfirmed(v === true)}
                disabled={isPending}
              />
              <Label htmlFor="close-confirmed" className="text-sm font-normal leading-snug cursor-pointer">
                I confirm this issue has been verified as resolved. Closing is final for this ticket
                workflow.
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCloseDialogOpen(false)
                setCloseNotes('')
                setCloseConfirmed(false)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="gradient" onClick={confirmClose} disabled={isPending || !closeConfirmed}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Closing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Close ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust due date */}
      <Dialog open={dueDateDialogOpen} onOpenChange={setDueDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set due date</DialogTitle>
            <DialogDescription>
              Choose when this ticket should be resolved by. Manual dates override SLA until priority
              changes or you reset to SLA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="due-datetime">Due</Label>
            <Input
              id="due-datetime"
              type="datetime-local"
              value={dueDateInput}
              onChange={(e) => setDueDateInput(e.target.value)}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDueDateDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={saveManualDueDate} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Dialog */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Ticket</DialogTitle>
            <DialogDescription>
              Please provide a reason for reopening this {ticket.status} ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reopen-reason">Reason (required)</Label>
            <Textarea
              id="reopen-reason"
              placeholder="Explain why this ticket needs to be reopened..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              rows={4}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters required
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReopenDialogOpen(false)
                setReopenReason('')
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleReopen}
              disabled={isPending || reopenReason.trim().length < 10}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reopening...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reopen Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={confirmStatusDialogOpen}
        onOpenChange={setConfirmStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the ticket status from{' '}
              <span className="font-semibold text-foreground">
                {TICKET_STATUS_LABELS[ticket.status]}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-foreground">
                {pendingStatus && TICKET_STATUS_LABELS[pendingStatus as TicketStatus]}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmStatusDialogOpen(false)
                setPendingStatus(null)
              }}
              disabled={isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmStatusChange()
              }}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment Confirmation Dialog */}
      <AlertDialog
        open={confirmAssignDialogOpen}
        onOpenChange={setConfirmAssignDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this ticket to{' '}
              <span className="font-semibold text-foreground">
                {pendingAssignee === currentUserId
                  ? 'yourself'
                  : staffUsers.find((u) => u.id === pendingAssignee)?.full_name ||
                    'Unknown User'}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmAssignDialogOpen(false)
                setPendingAssignee(null)
              }}
              disabled={isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmAssignment()
              }}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Confirm Assignment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
