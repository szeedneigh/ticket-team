"use client"

import { useState, useTransition, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, X, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/profile'
import type { User } from '@/lib/types/users'
import { getDepartments } from '@/lib/departments/actions'
import type { Department } from '@/lib/departments/actions'
import { DepartmentSelect } from '@/components/departments/department-select'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: User
  onCancel?: () => void
  onSuccess?: () => void
  /** Whether the form should start in edit mode (controlled by parent) */
  defaultEditing?: boolean
}

export function ProfileForm({ user, onCancel, onSuccess, defaultEditing = false }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing)
  const [isPending, startTransition] = useTransition()
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
      position: user.position || '',
      department: user.department || '',
      phone: user.phone || '',
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('full_name', data.full_name)
        if (data.position) formData.append('position', data.position)
        if (data.department) formData.append('department', data.department)
        if (data.phone) formData.append('phone', data.phone)

        const result = await updateProfile(formData)
        
        if (result.success) {
          toast.success('Profile updated successfully')
          setIsEditing(false)
          reset(data)
          onSuccess?.()
        } else {
          toast.error(result.error || 'Failed to update profile')
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        // Client-side logging - only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Profile update error:', error)
        }
      }
    })
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    onCancel?.()
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Read-only fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={user.email}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            Email cannot be changed. Contact administrator if needed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={user.role.replace('_', ' ')}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            Role is managed by administrators.
          </p>
        </div>
      </div>

      <Separator />

      {/* Editable fields */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#003B73]">Personal Information</h3>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              {...register('position')}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
              placeholder="e.g., Teacher, Staff, Student"
            />
            {errors.position && (
              <p className="text-sm text-red-500">{errors.position.message}</p>
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
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                  placeholder="Select a department"
                />
              )}
            />
            {errors.department && (
              <p className="text-sm text-red-500">{errors.department.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register('phone')}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
              placeholder="+63 123 456 7890"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {isEditing && (
        <Card className="p-4 bg-gray-50/50">
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}
    </form>
  )
}
