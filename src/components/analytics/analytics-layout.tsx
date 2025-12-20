/**
 * Analytics Layout Component
 *
 * Premium shared layout for analytics pages with glassmorphism navigation,
 * smooth tab transitions, and modern pill-style active states.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChartIcon, UsersIcon, HeartIcon, TicketIcon, BotIcon } from 'lucide-react'
import { motion } from 'framer-motion'

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
    title: 'Staff',
    href: '/analytics/staff',
    icon: UsersIcon,
  },
  {
    title: 'Satisfaction',
    href: '/analytics/satisfaction',
    icon: HeartIcon,
  },
  {
    title: 'AI Chat',
    href: '/analytics/ai',
    icon: BotIcon,
  },
]

export interface AnalyticsLayoutProps {
  children: React.ReactNode
}

export function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-8">
      {/* Analytics Navigation - Glassmorphism pill tabs */}
      <div className="relative">
        <nav className="flex gap-1.5 p-1.5 overflow-x-auto bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg">
          {analyticsNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  'hover:bg-white/50 dark:hover:bg-white/10',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="analytics-active-tab"
                    className="absolute inset-0 bg-gradient-to-r from-[#0693D2] to-[#0570A6] rounded-xl shadow-lg"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className={cn('relative z-10 h-4 w-4', isActive && 'text-white')} />
                <span className="relative z-10 whitespace-nowrap">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
