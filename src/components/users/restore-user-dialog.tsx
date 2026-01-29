/**
 * Restore User Dialog Component
 *
 * Dialog for restoring (reactivating) an archived user
 * Allows the user to sign in again
 */

'use client'

import { useState } from 'react'
import { Loader2, UserCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { reactivateUser } from '@/app/actions/users'
import type { User } from '@/lib/types/users'

interface RestoreUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RestoreUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RestoreUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const result = await reactivateUser({ userId: user.id })

      if (result.success) {
        toast({
          title: 'User restored',
          description: `${user.full_name} has been successfully restored.`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to restore user',
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <DialogTitle>Restore User</DialogTitle>
              <DialogDescription>
                Restore access for this user
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to restore <span className="font-medium text-foreground">{user.full_name}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              The user will be able to sign in again and access the system.
            </p>
          </div>

          {user.deactivated_at && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Archived on:</p>
              <p className="text-muted-foreground">
                {new Date(user.deactivated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
