/**
 * KPI Card Component
 *
 * Displays a single key performance indicator metric with
 * value, trend, and optional comparison.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from 'lucide-react'

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

  // Variant color mappings
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/20 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20',
    danger: 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20',
    info: 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20',
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            {description && (
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            )}
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{value}</div>
              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    trendDirection === 'up' && 'text-green-600 dark:text-green-400',
                    trendDirection === 'down' && 'text-red-600 dark:text-red-400',
                    trendDirection === 'neutral' && 'text-muted-foreground'
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
              <p className="mt-1 text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
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
