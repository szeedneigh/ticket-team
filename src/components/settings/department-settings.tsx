/**
 * Department Settings Component
 *
 * Manage organizational departments
 */

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, RefreshCw, Save } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Department {
  id: string
  name: string
  user_count?: number
  created_at?: string
}

export function DepartmentSettings() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [newDeptName, setNewDeptName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setIsLoading(true)
    try {
      // TODO: Fetch from API/database
      const saved = localStorage.getItem('departments')
      if (saved) {
        setDepartments(JSON.parse(saved))
      } else {
        // Default departments
        const defaultDepts: Department[] = [
          { id: '1', name: 'IT Services', user_count: 8 },
          { id: '2', name: 'Academic Affairs', user_count: 15 },
          { id: '3', name: 'Admissions', user_count: 5 },
          { id: '4', name: 'Finance', user_count: 6 },
          { id: '5', name: 'Library', user_count: 4 },
        ]
        setDepartments(defaultDepts)
      }
    } catch (error) {
      console.error('Error loading departments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a department name',
        variant: 'destructive',
      })
      return
    }

    const newDept: Department = {
      id: Date.now().toString(),
      name: newDeptName.trim(),
      user_count: 0,
    }

    setDepartments([...departments, newDept])
    setNewDeptName('')

    toast({
      title: 'Success',
      description: `Department "${newDept.name}" added`,
    })
  }

  const handleDeleteDepartment = (id: string) => {
    const dept = departments.find((d) => d.id === id)
    if (dept && dept.user_count && dept.user_count > 0) {
      toast({
        title: 'Cannot Delete',
        description: `Cannot delete department with ${dept.user_count} users. Reassign users first.`,
        variant: 'destructive',
      })
      return
    }

    setDepartments(departments.filter((d) => d.id !== id))

    toast({
      title: 'Success',
      description: 'Department deleted',
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Save to API/database
      localStorage.setItem('departments', JSON.stringify(departments))

      toast({
        title: 'Success',
        description: 'Departments saved successfully',
      })
    } catch (error) {
      console.error('Error saving departments:', error)
      toast({
        title: 'Error',
        description: 'Failed to save departments',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add New Department */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add New Department</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Department name"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddDepartment()
                }
              }}
            />
          </div>
          <Button onClick={handleAddDepartment}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Departments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Departments</h3>

        {departments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No departments yet. Add your first department above.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>
                      {dept.user_count !== undefined && (
                        <Badge variant="secondary">{dept.user_count} users</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={loadDepartments} disabled={isSaving}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
