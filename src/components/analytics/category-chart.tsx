/**
 * Category Chart Component
 *
 * Pie and donut charts for visualizing category distributions.
 * Uses Recharts for rendering.
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

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
}

// Default color palette
const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
]

export function CategoryChart({
  title,
  description,
  data,
  variant = 'pie',
  height = 300,
  showLegend = true,
  showPercentage = true,
  className,
  loading = false,
  colors = DEFAULT_COLORS,
}: CategoryChartProps) {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Prepare data with percentages
  const chartData = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
    fill: item.color || colors[index % colors.length],
  }))

  // Custom label for pie chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (entry: any) => {
    if (!showPercentage) return entry.name
    return `${entry.name} (${entry.percentage}%)`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; percentage: string | number } }> }) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} ({data.percentage}%)
        </p>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
          </div>
        ) : data.length === 0 ? (
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height: `${height}px` }}
          >
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={variant === 'donut' ? 80 : 100}
                innerRadius={variant === 'donut' ? 50 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Category Legend
 * Displays a legend with percentages and values
 */
export interface CategoryLegendProps {
  data: CategoryChartDataPoint[]
  className?: string
}

export function CategoryLegend({ data, className }: CategoryLegendProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={cn('space-y-2', className)}>
      {data.map((item, index) => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
        return (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span>{item.value}</span>
              <span className="text-muted-foreground">({percentage}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
