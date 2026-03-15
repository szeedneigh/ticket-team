/**
 * Category Chart Component
 *
 * Modern pie and donut charts with glassmorphism containers,
 * enhanced color palette, and premium styling.
 */

'use client'

import { useMemo, memo } from 'react'
import { PieChartIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { CHART_PALETTE } from '@/lib/constants/colors'

export interface CategoryChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface CategoryChartProps {
  title: string
  description?: string
  data: CategoryChartDataPoint[]
  variant?: 'pie' | 'donut'
  height?: number
  showLegend?: boolean
  showPercentage?: boolean
  className?: string
  loading?: boolean
  colors?: string[]
  centerLabel?: string
  centerValue?: string | number
}

export const CategoryChart = memo(function CategoryChart({
  title,
  description,
  data,
  variant = 'pie',
  height = 300,
  showLegend = true,
  showPercentage = true,
  className,
  loading = false,
  colors = [...CHART_PALETTE],
  centerLabel,
  centerValue,
}: CategoryChartProps) {
  // Memoize chart data calculation
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)

    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
      fill: item.color || colors[index % colors.length],
    }))
  }, [data, colors])

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  // Custom label for pie chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (entry: any) => {
    if (!showPercentage) return entry.name
    return `${entry.name} (${entry.percentage}%)`
  }

  // Custom tooltip with glassmorphism
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; percentage: string | number; fill: string } }> }) => {
    if (!active || !payload || !payload[0]) return null

    const chartData = payload[0].payload

    return (
      <div className="rounded-xl border border-white/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 shadow-xl">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: chartData.fill }}
          />
          <p className="text-sm font-semibold text-foreground">{chartData.name}</p>
        </div>
        <p className="text-lg font-bold mt-1" style={{ color: chartData.fill }}>
          {chartData.value.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">({chartData.percentage}%)</span>
        </p>
      </div>
    )
  }

  // Custom legend - using any type due to complex Recharts Legend payload types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props
    if (!payload) return null

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.value} 
              <span className="font-medium text-foreground ml-1">
                {entry.payload?.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn(
      'overflow-hidden border-white/30 dark:border-white/10',
      'bg-white/70 dark:bg-white/5 backdrop-blur-xl',
      'shadow-lg hover:shadow-xl transition-shadow duration-300',
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="h-32 w-32 animate-pulse rounded-full bg-muted/50" />
          </div>
        ) : data.length === 0 ? (
          <Empty className="border-0" style={{ minHeight: `${height}px` }}>
            <EmptyHeader>
              <EmptyMedia variant="icon"><PieChartIcon className="size-5" /></EmptyMedia>
              <EmptyTitle className="text-sm font-normal text-muted-foreground">No data available</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={!showLegend ? renderLabel : undefined}
                  outerRadius={variant === 'donut' ? 90 : 100}
                  innerRadius={variant === 'donut' ? 60 : 0}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="white"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      className="transition-opacity duration-200 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend content={renderLegend} />}
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label for donut charts */}
            {variant === 'donut' && (centerLabel || centerValue !== undefined) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: showLegend ? -20 : 0 }}>
                <div className="text-center">
                  {centerValue !== undefined && (
                    <p className="text-2xl font-bold text-foreground">{centerValue}</p>
                  )}
                  {centerLabel && (
                    <p className="text-xs text-muted-foreground">{centerLabel}</p>
                  )}
                  {!centerLabel && !centerValue && (
                    <>
                      <p className="text-2xl font-bold text-foreground">{total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

/**
 * Category Legend
 * Displays a legend with percentages and values
 */
export interface CategoryLegendProps {
  data: CategoryChartDataPoint[]
  className?: string
}

export const CategoryLegend = memo(function CategoryLegend({ data, className }: CategoryLegendProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  return (
    <div className={cn('space-y-2', className)}>
      {data.map((item, index) => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
        return (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: item.color || CHART_PALETTE[index % CHART_PALETTE.length] }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span>{item.value.toLocaleString()}</span>
              <span className="text-muted-foreground">({percentage}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
})
