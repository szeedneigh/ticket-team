/**
 * Department Settings Component
 *
 * Manage organizational departments with drag-and-drop reordering
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, RefreshCw, GripVertical, Building2, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  reorderDepartments,
  type Department,
} from '@/lib/departments/actions'

// ============================================================================
// Sortable Row Component
// ============================================================================

interface SortableRowProps {
  department: Department
  onDelete: (id: string) => void
  isSaving: boolean
  isLoading: boolean
}

function SortableRow({
  department,
  onDelete,
  isSaving,
  isLoading,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: department.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className="group">
      <TableCell className="w-[40px]">
        <button
          className="cursor-grab active:cursor-grabbing touch-none p-1 rounded hover:bg-muted transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
        </button>
      </TableCell>
      <TableCell className="font-medium text-foreground">{department.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Users className="h-3.5 w-3.5" />
          <span>{department.user_count || 0} users</span>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(department.id)}
          disabled={isSaving || isLoading}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DepartmentSettings() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [newDeptName, setNewDeptName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const loadDepartments = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDepartments()

      if (result.success && result.data) {
        setDepartments(result.data)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load departments',
          variant: 'destructive',
        })
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
  }, [toast])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a department name',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await createDepartment({ name: newDeptName.trim() })

      if (result.success) {
        toast({
          title: 'Success',
          description: `Department "${newDeptName.trim()}" added`,
        })
        setNewDeptName('')
        await loadDepartments()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create department',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating department:', error)
      toast({
        title: 'Error',
        description: 'Failed to create department',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    const dept = departments.find((d) => d.id === id)
    if (dept && dept.user_count && dept.user_count > 0) {
      toast({
        title: 'Cannot Delete',
        description: `Cannot delete department with ${dept.user_count} users. Reassign users first.`,
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await deleteDepartment(id)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Department deleted',
        })
        await loadDepartments()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete department',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting department:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete department',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = departments.findIndex((dept) => dept.id === active.id)
    const newIndex = departments.findIndex((dept) => dept.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newDepartments = arrayMove(departments, oldIndex, newIndex)
    setDepartments(newDepartments)

    const updates = newDepartments.map((dept, index) => ({
      id: dept.id,
      display_order: (index + 1) * 10,
    }))

    setIsSaving(true)
    try {
      const result = await reorderDepartments(updates)

      if (!result.success) {
        setDepartments(departments)
        toast({
          title: 'Error',
          description: result.error || 'Failed to reorder departments',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Departments reordered successfully',
        })
        await loadDepartments()
      }
    } catch (error) {
      setDepartments(departments)
      console.error('Error reordering departments:', error)
      toast({
        title: 'Error',
        description: 'Failed to reorder departments',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium leading-none">Departments</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure organizational teams and reorder them for dropdowns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDepartments} disabled={isSaving || isLoading}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Add New Department */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Plus className="h-4 w-4" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Create Department</h4>
        </div>
        
        <div className="flex gap-3 max-w-lg">
          <Input
            placeholder="e.g. Information Technology"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddDepartment()
            }}
            className="flex-1"
          />
          <Button
          onClick={handleAddDepartment}
          disabled={isSaving || isLoading}
          className="shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all bg-gradient-to-r from-[#1f3463] to-[#2cafdd] hover:opacity-90 text-white border-0"
        >
          Add Department
        </Button>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Departments List */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Building2 className="h-4 w-4" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Department List</h4>
        </div>

        {departments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
            <p className="text-muted-foreground">
              No departments defined yet. Add one above to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card/50 overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={departments.map((dept) => dept.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {departments.map((department) => (
                      <SortableRow
                        key={department.id}
                        department={department}
                        onDelete={handleDeleteDepartment}
                        isSaving={isSaving}
                        isLoading={isLoading}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}
      </section>
    </div>
  )
}
