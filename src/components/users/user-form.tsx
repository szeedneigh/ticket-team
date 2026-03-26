/**
 * User Form Component
 *
 * Form for creating and editing users
 * Supports role-based field visibility and validation
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createUser, updateUser } from '@/app/actions/users'
import { createUserSchema, updateUserSchema } from '@/lib/validations/users'
import { getRoleDescription } from './role-badge'
import type { User } from '@/lib/types/users'
import type { UserRole } from '@/lib/types/database'
import type { z } from 'zod'
import type { Department } from '@/lib/departments/actions'
import { DepartmentSelect } from '@/components/departments/department-select'

interface UserFormProps {
  mode: 'create' | 'edit'
  user?: User
  currentUserRole: 'admin' | 'super_admin'
  /** Rows from `departments` table for the department dropdown */
  departments: Department[]
  onSuccess?: (user?: User) => void
  onCancel?: () => void
}

type CreateFormData = z.infer<typeof createUserSchema>
type UpdateFormData = z.infer<typeof updateUserSchema>
type FormData = CreateFormData | UpdateFormData

export function UserForm({
  mode,
  user,
  currentUserRole,
  departments,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Use a unified form type
  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(mode === 'create' ? createUserSchema : updateUserSchema as any),
    defaultValues:
      mode === 'edit' && user
        ? {
            full_name: user.full_name,
            department: user.department || '',
            position: user.position || '',
          }
        : {
            full_name: '',
            email: '',
            password: '',
            role: 'employee' as UserRole,
            department: '',
            position: '',
          },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const result = await createUser(data as CreateFormData)

        if (result.success) {
          toast({
            title: 'User created',
            description: `${data.full_name} has been successfully created.`,
          })
          form.reset()
          onSuccess?.(result.data)
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create user',
            variant: 'destructive',
          })
        }
      } else if (user) {
        const result = await updateUser(user.id, data as UpdateFormData)

        if (result.success) {
          toast({
            title: 'User updated',
            description: `${data.full_name || user.full_name} has been successfully updated.`,
          })
          onSuccess?.(result.data)
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update user',
            variant: 'destructive',
          })
        }
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Personal Information
          </h3>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Juan Dela Cruz"
                    {...field}
                    className="bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email (Create mode only) */}
          {mode === 'create' && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan.delacruz@laverdad.edu.ph"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20"
                    />
                  </FormControl>
                  <FormDescription>
                    Must be a @laverdad.edu.ph or @student.laverdad.edu.ph email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Password (Create mode only) */}
          {mode === 'create' && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20"
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 8 characters with uppercase, lowercase, and number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Role & Department
          </h3>
          
          {/* Role (Create mode only, or super_admin editing) */}
          {mode === 'create' && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">
                        <div className="flex flex-col items-start">
                          <span>Employee</span>
                          <span className="text-xs text-muted-foreground">
                            {getRoleDescription('employee')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="staff">
                        <div className="flex flex-col items-start">
                          <span>Staff</span>
                          <span className="text-xs text-muted-foreground">
                            {getRoleDescription('staff')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col items-start">
                          <span>Admin</span>
                          <span className="text-xs text-muted-foreground">
                            {getRoleDescription('admin')}
                          </span>
                        </div>
                      </SelectItem>
                      {currentUserRole === 'super_admin' && (
                        <SelectItem value="super_admin">
                          <div className="flex flex-col items-start">
                            <span>Super Admin</span>
                            <span className="text-xs text-muted-foreground">
                              {getRoleDescription('super_admin')}
                            </span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {currentUserRole === 'admin' && (
                    <FormDescription>
                      Admins cannot create super_admin users
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Department */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <DepartmentSelect
                      departments={departments}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      placeholder="Select department"
                      className="bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Position */}
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="System Administrator"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
