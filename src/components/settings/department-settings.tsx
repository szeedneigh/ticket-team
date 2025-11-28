/**
 * Department Settings Component
 *
 * Manage organizational departments with drag-and-drop reordering
 */

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, RefreshCw, GripVertical } from 'lucide-react'
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
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[40px]">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{department.name}</TableCell>
      <TableCell>
        {department.user_count !== undefined && (
          <Badge variant="secondary">{department.user_count} users</Badge>
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(department.id)}
          disabled={isSaving || isLoading}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
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

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
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
  }

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
        // Reload departments to get updated list
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
        // Reload departments to get updated list
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

    // Optimistically update UI
    const newDepartments = arrayMove(departments, oldIndex, newIndex)
    setDepartments(newDepartments)

    // Prepare updates with new display_order values
    const updates = newDepartments.map((dept, index) => ({
      id: dept.id,
      display_order: (index + 1) * 10, // Use multiples of 10
    }))

    // Save to database
    setIsSaving(true)
    try {
      const result = await reorderDepartments(updates)

      if (!result.success) {
        // Revert on error
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
        // Reload to get fresh data
        await loadDepartments()
      }
    } catch (error) {
      // Revert on error
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
          <Button onClick={handleAddDepartment} disabled={isSaving || isLoading}>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
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
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={loadDepartments} disabled={isSaving || isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
