'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateUserDepartment } from '@/app/actions/onboarding'
import type { User } from '@/lib/types/users'

interface DepartmentSelectionClientProps {
  user: Pick<User, 'id' | 'full_name' | 'department' | 'role'>
}

// LVCC Departments
const DEPARTMENTS = [
  { id: 'MIS', name: 'Management Information Systems (MIS)', icon: '💻' },
  { id: 'REGISTRAR', name: 'Registrar Office', icon: '📋' },
  { id: 'ACCOUNTING', name: 'Accounting Office', icon: '💰' },
  { id: 'CASHIER', name: 'Cashier Office', icon: '💵' },
  { id: 'LIBRARY', name: 'Library', icon: '📚' },
  { id: 'GUIDANCE', name: 'Guidance Office', icon: '🧭' },
  { id: 'ACADEMIC_AFFAIRS', name: 'Academic Affairs', icon: '🎓' },
  { id: 'STUDENT_AFFAIRS', name: 'Student Affairs', icon: '👥' },
  { id: 'HR', name: 'Human Resources', icon: '👔' },
  { id: 'ADMIN', name: 'Administration', icon: '🏢' },
  { id: 'FACULTY_CAS', name: 'Faculty - College of Arts & Sciences', icon: '🔬' },
  { id: 'FACULTY_CBM', name: 'Faculty - College of Business & Management', icon: '📊' },
  { id: 'FACULTY_CTE', name: 'Faculty - College of Teacher Education', icon: '✏️' },
  { id: 'FACULTY_CHTM', name: 'Faculty - College of Hospitality & Tourism', icon: '🏨' },
  { id: 'MAINTENANCE', name: 'Maintenance & Facilities', icon: '🔧' },
  { id: 'SECURITY', name: 'Security Office', icon: '🛡️' },
  { id: 'OTHER', name: 'Other', icon: '📌' },
]

export function DepartmentSelectionClient({ user }: DepartmentSelectionClientProps) {
  const router = useRouter()
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!selectedDepartment) {
      toast.error('Please select a department')
      return
    }

    startTransition(async () => {
      const result = await updateUserDepartment(selectedDepartment)

      if (result.success) {
        toast.success('Department saved successfully!', {
          description: 'Redirecting to dashboard...',
        })
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      } else {
        toast.error('Failed to save department', {
          description: result.error,
        })
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/40">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        <Card className="border-2 shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Building className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome to Ticket Team!</h1>
              <p className="text-lg text-muted-foreground mb-1">
                Hello, {user.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Please select your department to complete your profile setup
              </p>
            </div>

            {/* Department Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {DEPARTMENTS.map((dept) => (
                <motion.button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${
                      selectedDepartment === dept.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">{dept.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{dept.name}</p>
                        {selectedDepartment === dept.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleSubmit}
                disabled={!selectedDepartment || isPending}
                size="lg"
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    {selectedDepartment && <CheckCircle className="ml-2 h-5 w-5" />}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Note: Your department selection is permanent and cannot be changed later.
                Please contact IT Support if you need to update your department.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
