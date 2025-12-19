/**
 * Reactivate User Dialog
 *
 * Confirmation dialog for reactivating a previously deactivated user
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
import { useToast } from '@/hooks/use-toast'
import { reactivateUser } from '@/app/actions/users'
import type { User } from '@/lib/types/users'

interface ReactivateUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReactivateUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ReactivateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleReactivate = async () => {
    setIsLoading(true)

    try {
      const result = await reactivateUser({
        userId: user.id,
      })

      if (result.success) {
        toast({
          title: 'User reactivated',
          description: `${user.full_name} has been successfully reactivated.`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reactivate user',
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
          <AlertDialogTitle>Reactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reactivate <strong>{user.full_name}</strong>? This user will
            regain access to the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {user.deactivated_at && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Deactivation Details:</p>
            <p className="text-muted-foreground">
              Deactivated on:{' '}
              {new Date(user.deactivated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReactivate}
            disabled={isLoading}
          >
            {isLoading ? 'Reactivating...' : 'Reactivate User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
