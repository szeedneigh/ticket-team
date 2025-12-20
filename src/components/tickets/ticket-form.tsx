'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from './file-upload'
import { createTicketSchema, type CreateTicketInput } from '@/lib/validations/tickets'
import { createTicket } from '@/app/actions/tickets'
import type { Category } from '@/lib/tickets/queries'
import { SUCCESS_MESSAGES } from '@/lib/constants'

/**
 * Ticket Form Component
 *
 * Form for creating new tickets with validation, file uploads, and Server Action submission.
 * Features:
 * - Title and description fields
 * - Category/subcategory selection (cascading)
 * - Priority selection
 * - Multiple file attachments
 * - Form validation with Zod
 * - Server Action submission with loading states
 * - Toast notifications
 */

interface TicketFormProps {
  categories: (Category & { subcategories: Category[] })[]
  onCancel?: () => void
}

export function TicketForm({ categories, onCancel }: TicketFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [files, setFiles] = useState<File[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      subcategory: null,
      priority: 'medium',
    },
  })

  // Watch category changes to update subcategories
  const categoryValue = watch('category')

  useEffect(() => {
    if (categoryValue) {
      const category = categories.find((c) => c.name === categoryValue)
      if (category) {
        setSubcategories(category.subcategories)
      } else {
        setSubcategories([])
      }
      // Reset subcategory when category changes
      setValue('subcategory', null)
    } else {
      setSubcategories([])
    }
  }, [categoryValue, categories, setValue])

  const onSubmit = async (data: CreateTicketInput) => {
    startTransition(async () => {
      try {
        // Create FormData for Server Action
        const formData = new FormData()
        formData.append('title', data.title)
        formData.append('description', data.description)
        formData.append('category', data.category)
        if (data.subcategory) {
          formData.append('subcategory', data.subcategory)
        }
        formData.append('priority', data.priority)

        // Add files to FormData
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file)
        })
        formData.append('file_count', files.length.toString())

        // Call Server Action
        const result = await createTicket(formData)

        if (result.success && result.data) {
          toast.success(SUCCESS_MESSAGES.TICKET_CREATED)
          reset()
          setFiles([])
          // Redirect to ticket detail page
          router.push(`/tickets/${result.data.id}`)
        } else {
          toast.error(result.error || 'Failed to create ticket')
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        if (process.env.NODE_ENV === 'development') {
          console.error('Ticket creation error:', error)
        }
      }
    })
  }

  const handleCancel = () => {
    if (isDirty || files.length > 0) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      )
      if (!confirmed) return
    }

    reset()
    setFiles([])
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Ticket</CardTitle>
        <CardDescription>
          Submit a support request and our team will assist you as soon as possible.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief summary of your issue"
              {...register('title')}
              disabled={isPending}
              aria-invalid={errors.title ? 'true' : 'false'}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your issue"
              rows={6}
              {...register('description')}
              disabled={isPending}
              aria-invalid={errors.description ? 'true' : 'false'}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Be as specific as possible to help us resolve your issue quickly
            </p>
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={categoryValue || ''}
              onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
              disabled={isPending}
            >
              <SelectTrigger id="category" aria-invalid={errors.category ? 'true' : 'false'}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Subcategory Field (conditional) */}
          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory (Optional)</Label>
              <Select
                value={watch('subcategory') || ''}
                onValueChange={(value) =>
                  setValue('subcategory', value || null, { shouldValidate: true })
                }
                disabled={isPending}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.name}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Field */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              Priority <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('priority')}
              onValueChange={(value) =>
                setValue('priority', value as 'low' | 'medium' | 'high', {
                  shouldValidate: true,
                })
              }
              disabled={isPending}
            >
              <SelectTrigger id="priority" aria-invalid={errors.priority ? 'true' : 'false'}>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Not urgent</SelectItem>
                <SelectItem value="medium">Medium - Normal priority</SelectItem>
                <SelectItem value="high">High - Urgent</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select &quot;High&quot; only for urgent issues that block your work
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Attach screenshots or documents to help us understand your issue
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
