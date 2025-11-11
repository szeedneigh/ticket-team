/**
 * Category Badge Component
 *
 * Displays a color-coded category badge for KB articles.
 * Colors follow LVCC brand palette defined in the plan.
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: string
  subcategory?: string | null
  className?: string
}

/**
 * Category color mapping
 * Uses LVCC brand colors for consistency
 */
const categoryColors: Record<string, string> = {
  'Technical': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  'Account': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  'Enrollment': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  'General': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
  'Financial': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  'Academic': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
}

export function CategoryBadge({ category, subcategory, className }: CategoryBadgeProps) {
  const colorClass = categoryColors[category] || categoryColors['General']

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <Badge
        variant="outline"
        className={cn(
          'font-medium',
          colorClass
        )}
      >
        {category}
      </Badge>
      {subcategory && (
        <Badge
          variant="outline"
          className={cn(
            'font-normal text-xs',
            colorClass,
            'opacity-75'
          )}
        >
          {subcategory}
        </Badge>
      )}
    </div>
  )
}
