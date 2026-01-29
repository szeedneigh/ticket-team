/**
 * Archive User Dialog Component
 *
 * Dialog for archiving a user (permanent soft delete)
 * Archived users cannot sign in but data is retained for audit purposes
 */

'use client'

import { useState } from 'react'
import { Loader2, Archive } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { deactivateUser } from '@/app/actions/users'
import type { User } from '@/lib/types/users'

interface ArchiveUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ArchiveUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ArchiveUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const result = await deactivateUser({
        userId: user.id,
        reason: reason.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: 'User archived',
          description: `${user.full_name} has been successfully archived.`,
        })
        onOpenChange(false)
        setReason('')
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to archive user',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Archive className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Archive User</DialogTitle>
              <DialogDescription>
                This action will prevent the user from signing in
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to archive <span className="font-medium text-foreground">{user.full_name}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              The user will not be able to sign in, but their data and ticket history will be preserved.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Employee left the organization"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setReason('')
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
