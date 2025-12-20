/**
 * Deactivate User Dialog
 *
 * Confirmation dialog for deactivating a user account
 * Includes optional reason field
 */

'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { deactivateUser } from '@/app/actions/users'
import type { User } from '@/lib/types/users'

interface DeactivateUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: DeactivateUserDialogProps) {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDeactivate = async () => {
    setIsLoading(true)

    try {
      const result = await deactivateUser({
        userId: user.id,
        reason: reason || undefined,
      })

      if (result.success) {
        toast({
          title: 'User deactivated',
          description: `${user.full_name} has been successfully deactivated.`,
        })
        onOpenChange(false)
        setReason('')
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to deactivate user',
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
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate <strong>{user.full_name}</strong>? This user will
            no longer be able to access the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            placeholder="Enter reason for deactivation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-sm text-muted-foreground">
            {reason.length}/500 characters
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeactivate}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deactivating...' : 'Deactivate User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
