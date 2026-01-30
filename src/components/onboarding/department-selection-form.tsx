/**
 * Department Selection Form Component
 *
 * Client component for selecting department during onboarding.
 * Card-based grid selection with search for better UX.
 *
 * @module components/onboarding/department-selection-form
 */

'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search, Building2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateUserDepartment } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { Department } from '@/lib/departments/actions'

interface DepartmentSelectionFormProps {
  departments: Department[]
  userName: string
}

export function DepartmentSelectionForm({
  departments,
  userName: _userName,
}: DepartmentSelectionFormProps) {
  const router = useRouter()
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments
    const q = searchQuery.toLowerCase().trim()
    return departments.filter((dept) =>
      dept.name.toLowerCase().includes(q)
    )
  }, [departments, searchQuery])

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-muted/50 border-primary/10 focus-visible:ring-[#2cafdd]/30"
          aria-label="Search departments"
        />
      </div>

      {/* Department Grid */}
      <div className="max-h-[320px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {filteredDepartments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-8 text-center text-muted-foreground text-sm"
              >
                No departments match &quot;{searchQuery}&quot;
              </motion.div>
            ) : (
              filteredDepartments.map((dept) => (
                <motion.button
                  key={dept.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => {
                    setSelectedDepartment(dept.name)
                    setError(null)
                  }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200',
                    'hover:border-[#2cafdd]/40 hover:bg-[#2cafdd]/5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2cafdd]/50 focus-visible:ring-offset-2',
                    selectedDepartment === dept.name
                      ? 'border-[#0693D2] bg-[#2cafdd]/10 shadow-sm'
                      : 'border-border bg-card hover:shadow-sm'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                      selectedDepartment === dept.name
                        ? 'bg-[#0693D2] text-white'
                        : 'bg-muted group-hover:bg-[#2cafdd]/20 text-muted-foreground group-hover:text-[#0693D2]'
                    )}
                  >
                    {selectedDepartment === dept.name ? (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium leading-tight',
                      selectedDepartment === dept.name
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {dept.name}
                  </span>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && error.includes('Please select') && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {error && !error.includes('Please select') && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 pt-2">
        <Button
          type="submit"
          className="w-full h-11 font-medium bg-gradient-to-r from-[#1f3463] to-[#0693D2] hover:from-[#1a2d52] hover:to-[#057bb8] text-white shadow-lg shadow-[#1f3463]/20"
          disabled={isPending || !selectedDepartment}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue to Dashboard'
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Your department selection is permanent. Contact IT Support if you need
          to update it later.
        </p>
      </div>
    </form>
  )
}
