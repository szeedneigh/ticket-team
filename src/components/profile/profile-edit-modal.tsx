"use client"

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/profile'
import type { User } from '@/lib/types/users'
import { useRouter } from 'next/navigation'
import { getDepartments } from '@/lib/departments/actions'
import type { Department } from '@/lib/departments/actions'
import { DepartmentSelect } from '@/components/departments/department-select'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  department: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditModalProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditModal({ user, open, onOpenChange }: ProfileEditModalProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    void getDepartments().then((r) => {
      if (r.success && r.data) setDepartments(r.data)
    })
  }, [])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name || '',
      department: user.department || '',
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        full_name: user.full_name || '',
        department: user.department || '',
      })
    }
  }, [open, user, reset])

  const onSubmit = async (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('full_name', data.full_name)
        if (data.department) formData.append('department', data.department)

        const result = await updateProfile(formData)

        if (result.success) {
          toast.success('Profile updated successfully')
          reset(data)
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error(result.error || 'Failed to update profile')
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        if (process.env.NODE_ENV === 'development') {
          console.error('Profile update error:', error)
        }
      }
    })
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmClose) return
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleCancel() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information and preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Read-only fields */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact administrator if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={user.role.replace('_', ' ')}
                  disabled
                  className="bg-muted capitalize"
                />
                <p className="text-xs text-muted-foreground">
                  Role is managed by administrators.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable fields */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="Enter your full name"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <DepartmentSelect
                      id="department"
                      departments={departments}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      placeholder="Select department"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Choose your organizational unit. Must match an active department in the system.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
