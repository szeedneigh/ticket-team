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
  LucideIcon
} from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string | LucideIcon
  trend?: string | 'up' | 'down' | 'neutral'
  trendDirection?: 'up' | 'down'
  loading?: boolean
  description?: string
  variant?: 'default' | 'destructive' | 'warning'
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

  // Open Tickets → Emerald #10B981
  if (normalizedTitle.includes('open') && normalizedTitle.includes('ticket')) {
    return {
      badgeBg: 'bg-[#10B981]/10',
      badgeIcon: 'text-[#10B981]',
      valueText: 'text-[#10B981]',
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // Resolved Today → Gray #9CA3AF base, Blue #3B82F6 emphasis when value > 0
  if (normalizedTitle.includes('resolved') && normalizedTitle.includes('today')) {
    if (hasValue) {
      return {
        badgeBg: 'bg-[#3B82F6]/10',
        badgeIcon: 'text-[#3B82F6]',
        valueText: 'text-[#3B82F6]',
        trendUpText: 'text-green-500',
        trendDownText: 'text-red-500',
      }
    }
    // Gray when no value
    return {
      badgeBg: 'bg-[#9CA3AF]/10',
      badgeIcon: 'text-[#9CA3AF]',
      valueText: 'text-[#9CA3AF]',
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // Avg Response Time → Amber #F59E0B
  if (normalizedTitle.includes('response') || normalizedTitle.includes('avg')) {
    return {
      badgeBg: 'bg-[#F59E0B]/10',
      badgeIcon: 'text-[#F59E0B]',
      valueText: 'text-[#F59E0B]',
      trendUpText: 'text-green-500',
      trendDownText: 'text-red-500',
    }
  }

  // Satisfaction → Indigo #6366F1 primary, Gold #FACC15 accent for trend up
  if (normalizedTitle.includes('satisfaction') || normalizedTitle.includes('rating')) {
    return {
      badgeBg: 'bg-[#6366F1]/10',
      badgeIcon: 'text-[#6366F1]',
      valueText: 'text-[#6366F1]',
      trendUpText: 'text-[#FACC15]', // Gold accent for satisfaction trending up
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
  variant = 'default'
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
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px] hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold ${styles.valueText}`}>{displayValue}</p>
            {description && !trend && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && trend !== 'neutral' && typeof trend === 'string' && !['up', 'down'].includes(trend) && (
              <div className="flex items-center gap-1 mt-2">
                {effectiveTrendDirection === 'up' ? (
                  <TrendingUp className={`h-3 w-3 ${styles.trendUpText}`} />
                ) : (
                  <TrendingDown className={`h-3 w-3 ${styles.trendDownText}`} />
                )}
                <span className={`text-xs font-medium ${
                  effectiveTrendDirection === 'up' ? styles.trendUpText : styles.trendDownText
                }`}>
                  {trend}
                </span>
              </div>
            )}
            {trend === 'neutral' && description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 ${styles.badgeBg} rounded-[12px]`}>
            <IconComponent className={`h-6 w-6 ${styles.badgeIcon}`} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
