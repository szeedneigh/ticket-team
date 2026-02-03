'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, RotateCcw, User, Tag, CheckCircle, BookOpen } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
} from '@/app/actions/tickets'
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
}

export function TicketActions({
  ticket,
  staffUsers,
  currentUserId,
  isStaff,
  isSubmitter,
}: TicketActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

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

    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus as TicketStatus)

      if (result.success) {
        const message =
          newStatus === 'closed'
            ? SUCCESS_MESSAGES.TICKET_CLOSED
            : newStatus === 'canceled'
              ? SUCCESS_MESSAGES.TICKET_CANCELED
              : SUCCESS_MESSAGES.TICKET_UPDATED
        toast.success(message)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
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

    startTransition(async () => {
      const result = await assignTicket(ticket.id, userId)

      if (result.success) {
        toast.success('Ticket assigned successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to assign ticket')
      }
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
    </>
  )
}
