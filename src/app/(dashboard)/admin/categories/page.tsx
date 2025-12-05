/**
 * Category Management Page
 *
 * Advanced category management with hierarchy and drag-and-drop
 * Accessible only to admin and super_admin roles
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { CategoryTree } from '@/components/categories/category-tree'
import { CategoryForm } from '@/components/categories/category-form'
import { CategoryList } from '@/components/categories/category-list'
import {
  getCategories,
  reorderCategories,
  createCategory as createCategoryAction,
  updateCategory as updateCategoryAction,
  deleteCategory as deleteCategoryAction,
} from '@/app/actions/categories'

interface Category {
  id: string
  name: string
  parent_id: string | null
  type: 'ticket' | 'knowledge_base' | 'both'
  is_active: boolean
  display_order?: number
  created_at?: string
  children?: Category[]
  ticket_count?: number
  article_count?: number
}

export default function CategoriesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const result = await getCategories()
      
      if (result.error) {
        throw new Error(result.error)
      }

      const data = result.data || []

      // Build hierarchy
      const categoryMap = new Map<string, Category>(data.map((cat: Category) => [cat.id, { ...cat, children: [] as Category[] }]))
      const rootCategories: Category[] = []

      data.forEach((cat: Category) => {
        const category = categoryMap.get(cat.id)!
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          const parent = categoryMap.get(cat.parent_id)!
          if (!parent.children) parent.children = []
          parent.children.push(category)
        } else {
          rootCategories.push(category)
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async (categoryData: Partial<Category>) => {
    try {
      const result = await createCategoryAction({
        name: categoryData.name || '',
        parent_id: categoryData.parent_id || null,
        type: (categoryData.type as 'ticket' | 'knowledge_base' | 'both') || 'both',
        is_active: categoryData.is_active ?? true,
        display_order: categoryData.display_order || 0,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Category created successfully',
      })

      setShowAddForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const result = await updateCategoryAction({
        id,
        ...(updates.name && { name: updates.name }),
        ...(updates.parent_id !== undefined && { parent_id: updates.parent_id }),
        ...(updates.type && { type: updates.type as 'ticket' | 'knowledge_base' | 'both' }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        ...(updates.display_order !== undefined && { display_order: updates.display_order }),
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Category updated successfully',
      })

      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check if category has children
      const hasChildren = categories.some(cat =>
        cat.parent_id === id || cat.children?.some(child => child.id === id)
      )

      if (hasChildren) {
        toast({
          title: 'Cannot Delete',
          description: 'Please delete all subcategories first',
          variant: 'destructive',
        })
        return
      }

      const result = await deleteCategoryAction(id)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      })

      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const handleReorderCategories = async (reorderedCategories: Category[]) => {
    setIsLoading(true)
    try {
      // Map categories to { id, display_order } format
      const updates = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        display_order: (index + 1) * 10, // Use multiples of 10
      }))

      const result = await reorderCategories(updates)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Categories reordered successfully',
        })
        // Reload categories to get updated order from DB
        await fetchCategories()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reorder categories',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error reordering categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to reorder categories',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Category Management</h2>
          <p className="text-muted-foreground">
            Organize tickets and knowledge base articles with categories
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ticket Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter((c) => c.type === 'ticket' || c.type === 'both').length}
            </div>
            <p className="text-xs text-muted-foreground">For tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">KB Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter((c) => c.type === 'knowledge_base' || c.type === 'both').length}
            </div>
            <p className="text-xs text-muted-foreground">For knowledge base</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Tree View
          </TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Hierarchy</CardTitle>
              <CardDescription>
                Drag and drop to reorganize categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CategoryTree
                  categories={categories}
                  onEdit={setEditingCategory}
                  onDelete={handleDeleteCategory}
                  onReorder={handleReorderCategories}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>
                View and manage all categories in a list
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CategoryList
                  categories={categories}
                  onEdit={setEditingCategory}
                  onDelete={handleDeleteCategory}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Category Dialog */}
      {(showAddForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSubmit={(data) =>
            editingCategory
              ? handleUpdateCategory(editingCategory.id, data)
              : handleAddCategory(data)
          }
          onCancel={() => {
            setShowAddForm(false)
            setEditingCategory(null)
          }}
        />
      )}
    </div>
  )
}
