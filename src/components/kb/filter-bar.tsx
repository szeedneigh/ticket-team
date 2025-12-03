/**
 * Filter Bar Component
 *
 * Client component for filtering KB articles by category, tags, and sort order.
 * Updates URL params to trigger server-side filtering.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  categories: { category: string; subcategories: string[] }[]
  tags: string[]
  className?: string
}

type SortOption = 'recent' | 'popular' | 'helpful'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'helpful', label: 'Most Helpful' },
]

export function FilterBar({ categories, tags, className }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') || ''
  const currentSort = (searchParams.get('sort') || 'recent') as SortOption
  const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || []

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change
    params.delete('page')

    const newUrl = params.toString() ? `${pathname}?${params}` : pathname
    router.push(newUrl, { scroll: false })
  }

  const handleCategoryChange = (value: string) => {
    updateParams({ category: value === 'all' ? null : value })
  }

  const handleSortChange = (value: SortOption) => {
    updateParams({ sort: value })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]

    updateParams({ tags: newTags.length > 0 ? newTags.join(',') : null })
  }

  const handleClearFilters = () => {
    router.push(pathname, { scroll: false })
  }

  const hasActiveFilters = currentCategory || currentTags.length > 0 || currentSort !== 'recent'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 backdrop-blur-sm">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex-1 sm:max-w-[240px]">
            <Select value={currentCategory || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full bg-background/50 border-border/50 focus:ring-primary/20">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(({ category }) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="flex-1 sm:max-w-[200px]">
            <Select value={currentSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full bg-background/50 border-border/50 focus:ring-primary/20">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tag Filters */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Filter className="h-3 w-3" />
            <span>Filter by tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = currentTags.includes(tag)
              return (
                <Badge
                  key={tag}
                  variant={isActive ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-all duration-200 px-3 py-1',
                    isActive 
                      ? 'bg-primary hover:bg-primary/90 shadow-md shadow-primary/20' 
                      : 'bg-background/50 hover:bg-muted hover:border-primary/30'
                  )}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                  {isActive && <X className="ml-1.5 h-3 w-3" />}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {currentCategory && (
            <span>Category: <strong className="text-foreground">{currentCategory}</strong></span>
          )}
          {currentCategory && currentTags.length > 0 && <span className="text-muted-foreground/50">•</span>}
          {currentTags.length > 0 && (
            <span>
              {currentTags.length} tag{currentTags.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      )}
    </div>
  )
}
