/**
 * User Actions Menu
 *
 * Dropdown menu with actions for managing a user
 * Actions vary based on current user's role and target user's role
 */

'use client'

import { useState } from 'react'
import { MoreVertical, Edit, Archive, UserCheck, Shield } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ArchiveUserDialog } from './archive-user-dialog'
import { RestoreUserDialog } from './restore-user-dialog'
import { ChangeRoleDialog } from './change-role-dialog'
import type { User } from '@/lib/types/users'

interface UserActionsMenuProps {
  user: User
  currentUserRole: 'admin' | 'super_admin'
  onEdit?: (user: User) => void
  onActionComplete?: () => void
}

export function UserActionsMenu({
  user,
  currentUserRole,
  onEdit,
  onActionComplete,
}: UserActionsMenuProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false)

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

          {currentUserRole === 'super_admin' && (
            <DropdownMenuItem onClick={() => setShowChangeRoleDialog(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isDeactivated ? (
            <DropdownMenuItem onClick={() => setShowRestoreDialog(true)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Restore User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setShowArchiveDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <ArchiveUserDialog
        user={user}
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onSuccess={onActionComplete}
      />

      <RestoreUserDialog
        user={user}
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onSuccess={onActionComplete}
      />

      <ChangeRoleDialog
        user={user}
        open={showChangeRoleDialog}
        onOpenChange={setShowChangeRoleDialog}
        onSuccess={onActionComplete}
      />
    </>
  )
}
