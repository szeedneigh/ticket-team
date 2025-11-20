/**
 * Category Tree Component
 *
 * Hierarchical tree view of categories with drag-and-drop support
 */

'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Edit, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface CategoryTreeProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  onReorder: (categories: Category[]) => void
}

interface CategoryNodeProps extends CategoryTreeProps {
  category: Category
  level?: number
}

function CategoryNode({ category, level = 0, onEdit, onDelete, onReorder }: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0

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
        return 'KB'
      case 'both':
        return 'Both'
    }
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50 transition-colors',
          level > 0 && 'ml-6'
        )}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {/* Drag Handle */}
        <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Expand/Collapse */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Folder Icon */}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          ) : (
            <Folder className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          )
        ) : (
          <Folder className="h-5 w-5 text-muted-foreground" />
        )}

        {/* Category Name */}
        <span className="flex-1 font-medium">{category.name}</span>

        {/* Type Badge */}
        <Badge variant="outline" className={cn('text-xs', getTypeColor(category.type))}>
          {getTypeLabel(category.type)}
        </Badge>

        {/* Usage Stats */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          {category.ticket_count !== undefined && category.ticket_count > 0 && (
            <span>{category.ticket_count} tickets</span>
          )}
          {category.article_count !== undefined && category.article_count > 0 && (
            <span>{category.article_count} articles</span>
          )}
        </div>

        {/* Status Badge */}
        {!category.is_active && (
          <Badge variant="secondary" className="text-xs">
            Inactive
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              categories={[]}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({ categories, onEdit, onDelete, onReorder }: CategoryTreeProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Folder className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <p className="mt-4 text-muted-foreground">
          No categories yet. Click &quot;Add Category&quot; to create your first category.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      ))}
    </div>
  )
}
