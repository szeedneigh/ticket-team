/**
 * Status Tabs Component
 *
 * Tab navigation for filtering tickets by status
 * Uses semantic nav element with proper ARIA attributes
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Inbox, Clock, RotateCw, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TicketStatus } from '@/lib/types/database'

interface StatusTab {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  status?: TicketStatus
}

const STATUS_TABS: StatusTab[] = [
  {
    value: 'all',
    label: 'All Tickets',
    icon: Inbox,
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: Clock,
    status: 'open',
  },
  {
    value: 'ongoing',
    label: 'Ongoing',
    icon: RotateCw,
    status: 'in_progress',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    icon: CheckCircle2,
    status: 'resolved',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    status: 'canceled',
  },
]

export function StatusTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()

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

    router.push(`/tickets?${params.toString()}`)
  }

  // Determine current tab based on status param
  const currentStatus = searchParams.get('status') as TicketStatus | null
  const currentTab = currentStatus
    ? STATUS_TABS.find(t => t.status === currentStatus)?.value || 'all'
    : 'all'

  return (
    <nav className="flex items-center gap-1 border-b border-border" role="tablist" aria-label="Filter tickets by status">
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
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              "border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/50"
            )}
          >
            <IconComponent className="h-4 w-4" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
