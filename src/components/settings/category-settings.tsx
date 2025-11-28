/**
 * Category Settings Component
 *
 * Manage ticket and knowledge base categories
 */

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, RefreshCw, Save, FolderTree } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/app/actions/categories'

interface Category {
  id: string
  name: string
  type: 'ticket' | 'knowledge_base' | 'both'
  parent_id?: string | null
  is_active: boolean
  article_count?: number
  ticket_count?: number
}

export function CategorySettings() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'both' as Category['type'],
    parent_id: null as string | null,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const result = await getCategories()

      if (result.success && result.data) {
        setCategories(result.data as Category[])
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load categories',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await createCategory({
        name: newCategory.name.trim(),
        type: newCategory.type,
        parent_id: newCategory.parent_id,
        is_active: true,
        display_order: 0, // Will be auto-assigned by server action
      })

      if (result.success && result.data) {
        toast({
          title: 'Success',
          description: `Category "${result.data.name}" created`,
        })
        setNewCategory({ name: '', type: 'both', parent_id: null })
        // Reload categories to get updated list
        await loadCategories()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create category',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setIsLoading(true)
    try {
      const result = await deleteCategory(id, false) // Soft delete by default

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Category deactivated',
        })
        // Reload categories to get updated list
        await loadCategories()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete category',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    const category = categories.find((c) => c.id === id)
    if (!category) return

    setIsLoading(true)
    try {
      const result = await updateCategory({
        id,
        is_active: !category.is_active,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: `Category ${!category.is_active ? 'activated' : 'deactivated'}`,
        })
        // Reload categories to get updated list
        await loadCategories()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update category',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: Category['type']) => {
    switch (type) {
      case 'ticket':
        return 'Tickets'
      case 'knowledge_base':
        return 'KB'
      case 'both':
        return 'Both'
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
      {/* Info Banner */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <FolderTree className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              For advanced category management with hierarchy and drag-and-drop, visit the{' '}
              <Link
                href="/admin/categories"
                className="font-medium underline hover:text-blue-700 dark:hover:text-blue-300"
              >
                Category Management page
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Add New Category */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add New Category</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-type">Type</Label>
            <Select
              value={newCategory.type}
              onValueChange={(value: Category['type']) =>
                setNewCategory({ ...newCategory, type: value })
              }
            >
              <SelectTrigger id="cat-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ticket">Tickets Only</SelectItem>
                <SelectItem value="knowledge_base">Knowledge Base Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleAddCategory} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Categories</h3>

        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No categories yet. Add your first category above.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(category.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {category.ticket_count !== undefined && category.ticket_count > 0 && (
                          <Badge variant="secondary">
                            {category.ticket_count} tickets
                          </Badge>
                        )}
                        {category.article_count !== undefined && category.article_count > 0 && (
                          <Badge variant="secondary">
                            {category.article_count} articles
                          </Badge>
                        )}
                        {!category.ticket_count && !category.article_count && (
                          <span className="text-sm text-muted-foreground">Unused</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
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

      {/* Refresh Button - Categories are saved immediately on each action */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={loadCategories} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
