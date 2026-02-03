/**
 * Sign Out Button Component
 * 
 * Button that triggers sign out action.
 * Can be customized with different variants and sizes.
 * 
 * @module components/auth/sign-out-button
 */

'use client'

import { useState } from 'react'
import { useTransition } from 'react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
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
import { Loader2, LogOut } from 'lucide-react'
import type { ComponentProps } from 'react'

interface SignOutButtonProps {
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
  showIcon?: boolean
  children?: React.ReactNode
  className?: string
}

/**
 * Button to sign out current user
 * Shows confirmation dialog before signing out.
 *
 * @example
 * ```tsx
 * <SignOutButton variant="outline" showIcon>
 *   Sign out
 * </SignOutButton>
 * ```
 */
export function SignOutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children = 'Sign out',
  className,
}: SignOutButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleOpenClick = () => {
    setOpen(true)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenClick}
        disabled={isPending}
        className={className}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          showIcon && <LogOut className="h-4 w-4" />
        )}
        {!isPending && <span className={showIcon ? 'ml-2' : ''}>{children}</span>}
      </Button>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sign out'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

