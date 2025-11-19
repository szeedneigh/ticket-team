/**
 * Category List Component
 *
 * Flat list view of all categories
 */

'use client'

import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

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

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  // Flatten the category tree
  const flattenCategories = (
    cats: Category[],
    parentName?: string
  ): Array<Category & { parentName?: string }> => {
    const result: Array<Category & { parentName?: string }> = []

    cats.forEach((cat) => {
      result.push({ ...cat, parentName })
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, cat.name))
      }
    })

    return result
  }

  const flatCategories = flattenCategories(categories)

  const getTypeColor = (type: Category['type']) => {
    switch (type) {
      case 'ticket':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'knowledge_base':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'both':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
  }

  const getTypeLabel = (type: Category['type']) => {
    switch (type) {
      case 'ticket':
        return 'Tickets'
      case 'knowledge_base':
        return 'Knowledge Base'
      case 'both':
        return 'Both'
    }
  }

  if (flatCategories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No categories yet. Click &quot;Add Category&quot; to create your first category.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flatCategories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                {category.parentName ? (
                  <span className="text-sm text-muted-foreground">{category.parentName}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Top-level</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn('text-xs', getTypeColor(category.type))}>
                  {getTypeLabel(category.type)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {category.ticket_count !== undefined && category.ticket_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {category.ticket_count} tickets
                    </Badge>
                  )}
                  {category.article_count !== undefined && category.article_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
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
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
