/**
 * Tag Badge Component
 *
 * Displays a tag chip for KB articles.
 * Used for displaying article tags in cards and detail views.
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
}

export function TagBadge({ tag, className, variant = 'secondary' }: TagBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        'text-xs font-normal',
        className
      )}
    >
      {tag}
    </Badge>
  )
}

interface TagListProps {
  tags: string[]
  maxDisplay?: number
  className?: string
}

/**
 * Tag List Component
 * Displays multiple tags with optional truncation
 */
export function TagList({ tags, maxDisplay = 3, className }: TagListProps) {
  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = tags.length - maxDisplay

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {displayTags.map((tag) => (
        <TagBadge key={tag} tag={tag} />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
