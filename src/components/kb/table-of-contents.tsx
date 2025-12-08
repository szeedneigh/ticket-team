/**
 * Table of Contents Component
 *
 * Auto-generates a table of contents from article headings (h2, h3).
 * Features:
 * - Intersection Observer for active section highlighting
 * - Smooth scroll navigation
 * - Sticky sidebar on desktop
 * - Collapsible accordion on mobile
 * - Supports nested headings (h2 > h3)
 */

'use client'

import { useEffect, useState } from 'react'
import { useTocObserver } from '@/lib/hooks/use-toc-observer'
import { cn } from '@/lib/utils'
import { ChevronDown, List } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

interface TocHeading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  /**
   * HTML content to parse for headings
   */
  content: string
  /**
   * Additional CSS classes
   */
  className?: string
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const activeId = useTocObserver()

  // Parse HTML content to extract headings
  useEffect(() => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const headingElements = doc.querySelectorAll('h2, h3')

    const parsedHeadings: TocHeading[] = []

    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1])
      const text = heading.textContent || ''
      // Create ID from text if not present
      let id = heading.id || text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

      // Ensure unique IDs
      if (parsedHeadings.some(h => h.id === id)) {
        id = `${id}-${index}`
      }

      parsedHeadings.push({ id, text, level })
    })

    setHeadings(parsedHeadings)
  }, [content])

  // Smooth scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // Close mobile accordion after navigation
      setIsOpen(false)
    }
  }

  // Don't render if no headings
  if (headings.length === 0) {
    return null
  }

  return (
    <>
      {/* Mobile: Collapsible Accordion */}
      <div className="lg:hidden mb-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
              aria-label="Toggle table of contents"
            >
              <span className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Table of Contents
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <nav
              className="border border-border/40 rounded-xl p-4 bg-card/50 backdrop-blur-sm"
              aria-label="Table of contents"
            >
              <TocList
                headings={headings}
                activeId={activeId}
                onHeadingClick={scrollToHeading}
              />
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: Inline List (parent handles card wrapper) */}
      <nav
        className={cn(
          'hidden lg:block',
          className
        )}
        aria-label="Table of contents"
      >
        <TocList
          headings={headings}
          activeId={activeId}
          onHeadingClick={scrollToHeading}
        />
      </nav>
    </>
  )
}

interface TocListProps {
  headings: TocHeading[]
  activeId: string
  onHeadingClick: (id: string) => void
}

function TocList({ headings, activeId, onHeadingClick }: TocListProps) {
  return (
    <ul className="space-y-1 text-sm">
      {headings.map((heading) => (
        <li
          key={heading.id}
          className={cn(
            heading.level === 3 && 'pl-3'
          )}
        >
          <button
            onClick={() => onHeadingClick(heading.id)}
            className={cn(
              'text-left w-full transition-all duration-200',
              'py-1.5 px-3 rounded-md text-sm leading-snug',
              activeId === heading.id
                ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            aria-current={activeId === heading.id ? 'location' : undefined}
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  )
}
