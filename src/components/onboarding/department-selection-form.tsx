/**
 * Department Selection Form Component
 * 
 * Client component for selecting department during onboarding.
 * Handles form submission, validation, and error states.
 * 
 * @module components/onboarding/department-selection-form
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { updateUserDepartment } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import type { Department } from '@/lib/departments/actions'

interface DepartmentSelectionFormProps {
  departments: Department[]
  userName: string
}

export function DepartmentSelectionForm({
  departments,
  userName,
}: DepartmentSelectionFormProps) {
  const router = useRouter()
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDepartment) {
      setError('Please select a department')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateUserDepartment(selectedDepartment)

      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Failed to update department')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="department">
          Department <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedDepartment}
          onValueChange={setSelectedDepartment}
          disabled={isPending}
        >
          <SelectTrigger id="department" aria-invalid={!!error}>
            <SelectValue placeholder="Select your department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && error.includes('Please select') && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {error && !error.includes('Please select') && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Continue to Dashboard'
        )}
      </Button>
    </form>
  )
}

