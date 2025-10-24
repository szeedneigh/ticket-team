/**
 * Sign Out Button Component
 * 
 * Button that triggers sign out action.
 * Can be customized with different variants and sizes.
 * 
 * @module components/auth/sign-out-button
 */

'use client'

import { useState, useTransition } from 'react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
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
  className
}: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition()
  
  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
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
  )
}

