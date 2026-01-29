/**
 * Change Role Dialog Component
 *
 * Dialog for changing a user's role
 * Only accessible by super_admin
 */

'use client'

import { useState } from 'react'
import { Loader2, Shield } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updateUserRole } from '@/app/actions/users'
import { getRoleDescription } from './role-badge'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'

interface ChangeRoleDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (selectedRole === user.role) {
      toast({
        title: 'No changes',
        description: 'Please select a different role.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateUserRole({
        userId: user.id,
        newRole: selectedRole,
      })

      if (result.success) {
        toast({
          title: 'Role updated',
          description: `${user.full_name}'s role has been changed to ${selectedRole}.`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user role',
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update role for {user.full_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Role Info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-xs text-muted-foreground">Current Role</p>
            <p className="font-semibold text-base mt-1 capitalize">{user.role.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {getRoleDescription(user.role)}
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label htmlFor="role" className="text-base font-medium">Select New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger id="role" className="h-11">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent 
                position="popper" 
                sideOffset={4}
                className="w-[var(--radix-select-trigger-width)] max-h-[300px] overflow-y-auto"
              >
                <SelectItem value="employee" className="cursor-pointer py-3">
                  <span className="font-medium capitalize">Employee</span>
                </SelectItem>
                <SelectItem value="staff" className="cursor-pointer py-3">
                  <span className="font-medium capitalize">Staff</span>
                </SelectItem>
                <SelectItem value="admin" className="cursor-pointer py-3">
                  <span className="font-medium capitalize">Admin</span>
                </SelectItem>
                <SelectItem value="super_admin" className="cursor-pointer py-3">
                  <span className="font-medium capitalize">Super Admin</span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Show description for currently selected role */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm border border-muted">
              <p className="text-xs text-muted-foreground mb-1">
                {selectedRole === user.role ? 'Current role description:' : 'New role description:'}
              </p>
              <p className="text-xs">
                {getRoleDescription(selectedRole)}
              </p>
            </div>
          </div>
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
            disabled={isSubmitting || selectedRole === user.role}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
