/**
 * User Actions Menu
 *
 * Dropdown menu with actions for managing a user
 * Actions vary based on current user's role and target user's role
 */

'use client'

import { useState } from 'react'
import { MoreVertical, Edit, UserX, UserCheck, Shield } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DeactivateUserDialog } from './deactivate-user-dialog'
import { ReactivateUserDialog } from './reactivate-user-dialog'
import type { User } from '@/lib/types/users'

interface UserActionsMenuProps {
  user: User
  currentUserRole: 'admin' | 'super_admin'
  onEdit?: (user: User) => void
  onChangeRole?: (user: User) => void
  onActionComplete?: () => void
}

export function UserActionsMenu({
  user,
  currentUserRole,
  onEdit,
  onChangeRole,
  onActionComplete,
}: UserActionsMenuProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)

  const isDeactivated = Boolean(user.deactivated_at)
  const isSuperAdmin = user.role === 'super_admin'
  const canManage = currentUserRole === 'super_admin' || !isSuperAdmin

  // If current user is admin and target is super_admin, show limited actions
  if (!canManage) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onEdit?.(user)}
            disabled
          >
            <Edit className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <span className="text-sm text-muted-foreground">
              Only super admins can manage other super admins
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => onEdit?.(user)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </DropdownMenuItem>

          {currentUserRole === 'super_admin' && onChangeRole && (
            <DropdownMenuItem onClick={() => onChangeRole(user)}>
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isDeactivated ? (
            <DropdownMenuItem onClick={() => setShowReactivateDialog(true)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Reactivate User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setShowDeactivateDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <DeactivateUserDialog
        user={user}
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        onSuccess={onActionComplete}
      />

      <ReactivateUserDialog
        user={user}
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onSuccess={onActionComplete}
      />
    </>
  )
}
