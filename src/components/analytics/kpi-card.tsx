/**
 * KPI Card Component
 *
 * Premium glassmorphism KPI cards with semantic colors,
 * gradient icon backgrounds, and subtle animations.
 */

'use client'

import { cn } from '@/lib/utils'
import {
  MinusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'

export interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number // percentage change
    label: string // e.g., "vs last period"
  }
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  loading?: boolean
}

// Variant configuration with semantic colors
const variantConfig = {
  default: {
    border: 'border-white/30',
    bg: 'bg-white/70 dark:bg-white/5',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-300',
    glow: '',
  },
  success: {
    border: 'border-emerald-200/50 dark:border-emerald-500/20',
    bg: 'bg-gradient-to-br from-white/80 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-900/10',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    iconColor: 'text-white',
    glow: 'shadow-emerald-500/10',
  },
  warning: {
    border: 'border-amber-200/50 dark:border-amber-500/20',
    bg: 'bg-gradient-to-br from-white/80 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-900/10',
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    iconColor: 'text-white',
    glow: 'shadow-amber-500/10',
  },
  danger: {
    border: 'border-red-200/50 dark:border-red-500/20',
    bg: 'bg-gradient-to-br from-white/80 to-red-50/50 dark:from-red-950/30 dark:to-red-900/10',
    iconBg: 'bg-gradient-to-br from-red-400 to-red-600',
    iconColor: 'text-white',
    glow: 'shadow-red-500/10',
  },
  info: {
    border: 'border-blue-200/50 dark:border-blue-500/20',
    bg: 'bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-900/10',
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    iconColor: 'text-white',
    glow: 'shadow-blue-500/10',
  },
}

export function KPICard({
  title,
  value,
  description,
  trend,
  icon,
  variant = 'default',
  className,
  loading = false,
}: KPICardProps) {
  // Determine trend direction
  const trendDirection =
    trend && trend.value > 0
      ? 'up'
      : trend && trend.value < 0
        ? 'down'
        : 'neutral'

  const config = variantConfig[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        // Glassmorphism base
        'relative overflow-hidden rounded-2xl p-5',
        'backdrop-blur-xl border',
        'shadow-lg hover:shadow-xl transition-shadow duration-300',
        // Variant styles
        config.bg,
        config.border,
        config.glow,
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground tracking-wide">
            {title}
          </h3>
          {icon && (
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl shadow-sm',
                config.iconBg,
                config.iconColor
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/50" />
            {description && (
              <div className="h-4 w-32 animate-pulse rounded bg-muted/30" />
            )}
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {value}
              </span>
              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                    trendDirection === 'up' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    trendDirection === 'down' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    trendDirection === 'neutral' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {trendDirection === 'up' && (
                    <TrendingUpIcon className="h-3 w-3" />
                  )}
                  {trendDirection === 'down' && (
                    <TrendingDownIcon className="h-3 w-3" />
                  )}
                  {trendDirection === 'neutral' && (
                    <MinusIcon className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {(description || trend) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {description}
                {trend && trend.label && (
                  <>
                    {description && ' • '}
                    {trend.label}
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

/**
 * KPI Card Grid Container
 * Responsive grid for displaying multiple KPI cards
 */
export function KPICardGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}
