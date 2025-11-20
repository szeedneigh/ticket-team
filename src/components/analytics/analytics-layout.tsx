/**
 * Analytics Layout Component
 *
 * Shared layout for all analytics pages with navigation and filters.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChartIcon, UsersIcon, HeartIcon, TicketIcon } from 'lucide-react'

const analyticsNavItems = [
  {
    title: 'Overview',
    href: '/analytics',
    icon: BarChartIcon,
  },
  {
    title: 'Tickets',
    href: '/analytics/tickets',
    icon: TicketIcon,
  },
  {
    title: 'Staff Performance',
    href: '/analytics/staff',
    icon: UsersIcon,
  },
  {
    title: 'Satisfaction',
    href: '/analytics/satisfaction',
    icon: HeartIcon,
  },
]

export interface AnalyticsLayoutProps {
  children: React.ReactNode
}

export function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-6">
      {/* Analytics Navigation */}
      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {analyticsNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors hover:text-primary',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  )
}
