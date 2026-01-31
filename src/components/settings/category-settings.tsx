/**
 * Category Settings Component
 *
 * Manage ticket and knowledge base categories
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, RefreshCw, Tag, Info } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
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

  const loadCategories = useCallback(async () => {
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
        setCategories([])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

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
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium leading-none">Categories</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Organize tickets and knowledge base articles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCategories} disabled={isLoading}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Info Banner */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
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
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Plus className="h-4 w-4" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Create Category</h4>
        </div>
        
        <div className="grid gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-5 space-y-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Hardware Support"
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

          <div className="md:col-span-4 space-y-2">
            <Label htmlFor="cat-type">Applies To</Label>
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

          <div className="md:col-span-3">
            <Button
              onClick={handleAddCategory}
              className="w-full btn-primary-brand"
            >
        Add Category
      </Button>
          </div>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Categories List */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Tag className="h-4 w-4" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Existing Categories</h4>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
            <p className="text-muted-foreground">
              No categories yet. Add your first category above.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="group">
                    <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {getTypeLabel(category.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {category.ticket_count !== undefined && category.ticket_count > 0 && (
                          <Badge variant="secondary" className="font-normal text-xs">
                            {category.ticket_count} tickets
                          </Badge>
                        )}
                        {category.article_count !== undefined && category.article_count > 0 && (
                          <Badge variant="secondary" className="font-normal text-xs">
                            {category.article_count} articles
                          </Badge>
                        )}
                        {!category.ticket_count && !category.article_count && (
                          <span className="text-sm text-muted-foreground text-xs">Unused</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.is_active ? 'default' : 'secondary'}
                        className={category.is_active ? "bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 border-green-500/20 shadow-none" : ""}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
