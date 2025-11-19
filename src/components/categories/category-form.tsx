/**
 * Category Form Component
 *
 * Form for creating and editing categories
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Category {
  id: string
  name: string
  parent_id: string | null
  type: 'ticket' | 'knowledge_base' | 'both'
  is_active: boolean
  created_at?: string
  children?: Category[]
  ticket_count?: number
  article_count?: number
}

interface CategoryFormProps {
  category?: Category | null
  categories: Category[]
  onSubmit: (data: Partial<Category>) => void
  onCancel: () => void
}

export function CategoryForm({ category, categories, onSubmit, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    parent_id: null,
    type: 'both',
    is_active: true,
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        parent_id: category.parent_id,
        type: category.type,
        is_active: category.is_active,
      })
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name?.trim()) {
      return
    }

    onSubmit(formData)
  }

  // Get flat list of all categories for parent selection
  const flattenCategories = (cats: Category[], level = 0): Array<Category & { level: number }> => {
    const result: Array<Category & { level: number }> = []
    cats.forEach((cat) => {
      // Skip current category when editing (can't be its own parent)
      if (category && cat.id === category.id) return

      result.push({ ...cat, level })
      if ('children' in cat && Array.isArray(cat.children)) {
        result.push(...flattenCategories(cat.children as Category[], level + 1))
      }
    })
    return result
  }

  const parentOptions = flattenCategories(categories)

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {category
                ? 'Update category information below.'
                : 'Create a new category for organizing tickets and knowledge base articles.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Hardware, Software"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent_id: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {'—'.repeat(cat.level)} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Optional: Make this a subcategory
              </p>
            </div>

            {/* Category Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Usage Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Category['type']) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Tickets Only</SelectItem>
                  <SelectItem value="knowledge_base">Knowledge Base Only</SelectItem>
                  <SelectItem value="both">Both Tickets & Knowledge Base</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Where this category can be used
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Available for selection in tickets and articles
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
