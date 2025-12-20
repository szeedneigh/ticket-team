/**
 * Bar Chart Component
 *
 * Modern horizontal and vertical bar charts with glassmorphism containers,
 * gradient fills, and premium styling.
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface BarChartDataPoint {
  name?: string
  value?: number
  color?: string
  [key: string]: string | number | undefined
}

export interface BarChartProps {
  title: string
  description?: string
  data: BarChartDataPoint[]
  dataKey?: string
  nameKey?: string
  orientation?: 'vertical' | 'horizontal'
  color?: string
  useGradient?: boolean
  showGrid?: boolean
  showLegend?: boolean
  height?: number
  className?: string
  loading?: boolean
  formatYAxis?: (value: number) => string
  formatXAxis?: (value: string) => string
  formatTooltip?: (value: number) => string
}

// Semantic color palette for charts
const CHART_COLORS = [
  '#0693D2', // Primary blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
]

export function BarChart({
  title,
  description,
  data,
  dataKey = 'value',
  nameKey = 'name',
  orientation = 'vertical',
  color = '#0693D2',
  useGradient = true,
  showGrid = true,
  showLegend = false,
  height = 300,
  className,
  loading = false,
  formatYAxis,
  formatXAxis,
  formatTooltip,
}: BarChartProps) {
  const chartId = `bar-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`

  // Custom tooltip with glassmorphism
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BarChartDataPoint; value: number }> }) => {
    if (!active || !payload || !payload[0]) return null

    const chartData = payload[0].payload
    const value = payload[0].value

    return (
      <div className="rounded-xl border border-white/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground">{chartData[nameKey]}</p>
        <p className="text-lg font-bold" style={{ color: chartData.color || color }}>
          {formatTooltip ? formatTooltip(value) : value.toLocaleString()}
        </p>
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
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="h-32 w-32 animate-pulse rounded-xl bg-muted/50" />
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
            <RechartsBarChart
              data={data}
              layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            >
              <defs>
                <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  strokeOpacity={0.1}
                  horizontal={orientation !== 'horizontal'}
                  vertical={orientation === 'horizontal'}
                />
              )}
              {orientation === 'vertical' ? (
                <>
                  <XAxis
                    dataKey={nameKey}
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatXAxis}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxis}
                    dx={-10}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxis}
                  />
                  <YAxis
                    dataKey={nameKey}
                    type="category"
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                </>
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              {showLegend && <Legend />}
              <Bar 
                dataKey={dataKey} 
                fill={useGradient ? `url(#${chartId})` : color} 
                radius={[6, 6, 6, 6]}
                maxBarSize={50}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || (useGradient ? `url(#${chartId})` : CHART_COLORS[index % CHART_COLORS.length])} 
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Stacked Bar Chart
 * Supports multiple stacked data series
 */
export interface StackedBarChartProps {
  title: string
  description?: string
  data: Array<Record<string, string | number>>
  bars: {
    dataKey: string
    name: string
    color: string
  }[]
  nameKey?: string
  orientation?: 'vertical' | 'horizontal'
  showGrid?: boolean
  height?: number
  className?: string
  loading?: boolean
  formatYAxis?: (value: number) => string
}

export function StackedBarChart({
  title,
  description,
  data,
  bars,
  nameKey = 'name',
  orientation = 'vertical',
  showGrid = true,
  height = 300,
  className,
  loading = false,
  formatYAxis,
}: StackedBarChartProps) {
  return (
    <Card className={cn(
      'overflow-hidden border-white/30 dark:border-white/10',
      'bg-white/70 dark:bg-white/5 backdrop-blur-xl',
      'shadow-lg hover:shadow-xl transition-shadow duration-300',
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="h-32 w-32 animate-pulse rounded-xl bg-muted/50" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
              data={data}
              layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  strokeOpacity={0.1}
                />
              )}
              {orientation === 'vertical' ? (
                <>
                  <XAxis
                    dataKey={nameKey}
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxis}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxis}
                  />
                  <YAxis
                    dataKey={nameKey}
                    type="category"
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                </>
              )}
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(12px)',
                }}
              />
              <Legend />
              {bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  stackId="stack"
                  fill={bar.color}
                  radius={[4, 4, 4, 4]}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
