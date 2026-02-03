/**
 * Status Tabs Component
 *
 * Tab navigation for filtering tickets by status
 * Uses semantic nav element with proper ARIA attributes
 * Enhanced with framer-motion for smooth transitions
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Inbox,
  Clock,
  RotateCw,
  PauseCircle,
  CheckCircle2,
  Archive,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TicketStatus } from '@/lib/types/database'
import { TICKET_STATUS_LABELS } from '@/lib/types/database'
import { motion } from 'framer-motion'

interface StatusTab {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  status?: TicketStatus
}

/** Tab config; labels for status tabs come from TICKET_STATUS_LABELS for consistency. */
const STATUS_TABS: StatusTab[] = [
  { value: 'all', label: 'All', icon: Inbox },
  { value: 'open', label: TICKET_STATUS_LABELS.open, icon: Clock, status: 'open' },
  { value: 'in_progress', label: TICKET_STATUS_LABELS.in_progress, icon: RotateCw, status: 'in_progress' },
  { value: 'on_hold', label: TICKET_STATUS_LABELS.on_hold, icon: PauseCircle, status: 'on_hold' },
  { value: 'resolved', label: TICKET_STATUS_LABELS.resolved, icon: CheckCircle2, status: 'resolved' },
  { value: 'closed', label: TICKET_STATUS_LABELS.closed, icon: Archive, status: 'closed' },
  { value: 'canceled', label: TICKET_STATUS_LABELS.canceled, icon: XCircle, status: 'canceled' },
]

export function StatusTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    const tab = STATUS_TABS.find(t => t.value === value)

    if (tab?.status) {
      params.set('status', tab.status)
    } else {
      params.delete('status')
    }

    // Reset to page 1 when changing tabs
    params.delete('page')

    // Use current pathname to maintain route context
    router.push(`${pathname}?${params.toString()}`)
  }

  // Determine current tab based on status param
  const currentStatus = searchParams.get('status') as TicketStatus | null
  const currentTab = currentStatus
    ? STATUS_TABS.find(t => t.status === currentStatus)?.value || 'all'
    : 'all'

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <nav 
        className="flex items-center gap-1 p-1 bg-muted/50 backdrop-blur-sm rounded-xl border border-white/10 w-max min-w-full md:min-w-0 md:w-auto" 
        role="tablist" 
        aria-label="Filter tickets by status"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = currentTab === tab.value
          const IconComponent = tab.icon

          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.value}`}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg z-10",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-status-tab"
                  className="absolute inset-0 bg-background shadow-sm rounded-lg border border-border/50"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <IconComponent className={cn("h-4 w-4 relative z-10", isActive && "text-blue-500")} aria-hidden="true" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
