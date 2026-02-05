"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Ticket,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  RotateCw,
  PauseCircle,
  XCircle,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS, SATISFACTION_ACCENT } from '@/lib/constants/colors'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string | LucideIcon
  trend?: string | 'up' | 'down' | 'neutral'
  trendDirection?: 'up' | 'down'
  loading?: boolean
  description?: string
  variant?: 'default' | 'destructive' | 'warning'
  className?: string
}

interface MetricStyles {
  badgeBg: string
  badgeIcon: string
  valueText: string
  trendUpText: string
  trendDownText: string
}

const iconMap: Record<string, LucideIcon> = {
  Ticket,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Users,
  AlertCircle,
  RotateCw,
  PauseCircle,
  XCircle,
}

/**
 * Returns metric-specific style classes based on card title
 * @param title - The card title to match against
 * @param value - Optional value to determine dynamic styling (e.g., Resolved Today)
 * @param variant - Optional variant for destructive or warning styles
 */
function getMetricStyles(title: string, value?: string | number, variant?: 'default' | 'destructive' | 'warning'): MetricStyles {
  const normalizedTitle = title.toLowerCase().trim()

  // Handle variant overrides
  if (variant === 'destructive') {
    return {
      badgeBg: 'bg-red-500/10',
      badgeIcon: 'text-red-500',
      valueText: 'text-red-500',
      trendUpText: 'text-red-600',
      trendDownText: 'text-green-500',
    }
  }

  if (variant === 'warning') {
    return {
      badgeBg: 'bg-amber-500/10',
      badgeIcon: 'text-amber-500',
      valueText: 'text-amber-500',
      trendUpText: 'text-red-500',
      trendDownText: 'text-green-500',
    }
  }

  // Extract numeric value for conditional styling
  const numericValue = typeof value === 'number' ? value : (value ? parseFloat(value.replace(/[^0-9.-]/g, '')) : 0)
  const hasValue = !isNaN(numericValue) && numericValue > 0

  // Open Tickets / Resolved → success
  if ((normalizedTitle.includes('open') && normalizedTitle.includes('ticket')) || normalizedTitle === 'resolved') {
    return {
      badgeBg: `bg-[${STATUS.success}]/10`,
      badgeIcon: `text-[${STATUS.success}]`,
      valueText: `text-[${STATUS.success}]`,
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // In Progress / Resolved Today (with value) → info
  if (normalizedTitle.includes('in progress') || (normalizedTitle.includes('resolved') && normalizedTitle.includes('today') && hasValue)) {
    return {
      badgeBg: `bg-[${STATUS.info}]/10`,
      badgeIcon: `text-[${STATUS.info}]`,
      valueText: `text-[${STATUS.info}]`,
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // Resolved Today (no value) → muted gray
  if (normalizedTitle.includes('resolved') && normalizedTitle.includes('today')) {
    return {
      badgeBg: 'bg-[#9ca3af]/10',
      badgeIcon: 'text-[#9ca3af]',
      valueText: 'text-[#9ca3af]',
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // On Hold / Avg Response Time → warning
  if (normalizedTitle.includes('on hold') || normalizedTitle.includes('response') || normalizedTitle.includes('avg')) {
    return {
      badgeBg: `bg-[${STATUS.warning}]/10`,
      badgeIcon: `text-[${STATUS.warning}]`,
      valueText: `text-[${STATUS.warning}]`,
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // Cancelled → gray
  if (normalizedTitle.includes('cancelled') || normalizedTitle.includes('canceled')) {
    return {
      badgeBg: 'bg-[#6b7280]/10',
      badgeIcon: 'text-[#6b7280]',
      valueText: 'text-[#6b7280]',
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // Satisfaction → central satisfaction accent
  if (normalizedTitle.includes('satisfaction') || normalizedTitle.includes('rating')) {
    return {
      badgeBg: `bg-[${SATISFACTION_ACCENT.primary}]/10`,
      badgeIcon: `text-[${SATISFACTION_ACCENT.primary}]`,
      valueText: `text-[${SATISFACTION_ACCENT.primary}]`,
      trendUpText: `text-[${SATISFACTION_ACCENT.trendUp}]`,
      trendDownText: 'text-red-500',
    }
  }

  // Fallback to primary styles for unmatched titles
  return {
    badgeBg: 'bg-primary/10',
    badgeIcon: 'text-primary',
    valueText: 'text-primary',
    trendUpText: 'text-green-500',
    trendDownText: 'text-red-500',
  }
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendDirection = 'up',
  loading = false,
  description,
  variant = 'default',
  className
}: StatsCardProps) {
  // Support both string icon names and LucideIcon components
  const IconComponent = typeof icon === 'string' ? (iconMap[icon] || Ticket) : icon
  const styles = getMetricStyles(title, value, variant)

  // Convert value to string if it's a number
  const displayValue = typeof value === 'number' ? value.toString() : value

  // Determine trend direction based on trend prop if it's a simple string
  const effectiveTrendDirection =
    trend === 'up' ? 'up' :
    trend === 'down' ? 'down' :
    trendDirection

  if (loading) {
    return (
      <Card className={cn("p-6 bg-card/50 backdrop-blur-md border-white/10 shadow-lg rounded-[24px]", className)}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn("h-full", className)}
    >
      <Card className="relative overflow-hidden p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg hover:shadow-md rounded-[24px] transition-all duration-300 group h-full flex flex-col justify-between">
        {/* Ambient background glow - Static now */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-10 ${styles.badgeBg.replace('/10', '')}`} />
        
        <div className="relative z-10 flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold tracking-tight ${styles.valueText}`}>{displayValue}</p>
            </div>
            
            {description && !trend && (
              <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>
            )}
            
            {trend && trend !== 'neutral' && typeof trend === 'string' && !['up', 'down'].includes(trend) && (
              <div className="flex items-center gap-1 mt-2">
                {effectiveTrendDirection === 'up' ? (
                  <TrendingUp className={`h-3 w-3 ${styles.trendUpText}`} />
                ) : (
                  <TrendingDown className={`h-3 w-3 ${styles.trendDownText}`} />
                )}
                <span className={`text-xs font-bold ${
                  effectiveTrendDirection === 'up' ? styles.trendUpText : styles.trendDownText
                }`}>
                  {trend}
                </span>
              </div>
            )}
            {trend === 'neutral' && description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          
          <div className={`p-3 ${styles.badgeBg} rounded-[16px] transition-transform duration-300`}>
            <IconComponent className={`h-6 w-6 ${styles.badgeIcon}`} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
