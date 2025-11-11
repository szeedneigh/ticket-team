/**
 * Breadcrumb Navigation Component
 *
 * Displays hierarchical navigation path for KB articles.
 * Format: Home > KB > Category > Article
 */

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  className?: string
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
      <ol className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
        {/* Home */}
        <li className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
        </li>

        {/* Dynamic items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast && 'text-foreground font-medium truncate max-w-[200px] sm:max-w-md'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
