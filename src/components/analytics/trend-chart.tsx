/**
 * Trend Chart Component
 *
 * Modern line and area charts with glassmorphism containers,
 * gradient fills, and premium tooltips.
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants/colors'

export interface TrendChartDataPoint {
  date?: string
  name?: string
  value: number
  label?: string
  [key: string]: string | number | undefined
}

export interface TrendChartProps {
  title: string
  description?: string
  data: TrendChartDataPoint[]
  dataKey?: string
  nameKey?: string
  variant?: 'line' | 'area'
  color?: string
  gradientFrom?: string
  gradientTo?: string
  showGrid?: boolean
  showLegend?: boolean
  height?: number
  className?: string
  loading?: boolean
  formatYAxis?: (value: number) => string
  formatTooltip?: (value: number) => string
}

export function TrendChart({
  title,
  description,
  data,
  dataKey = 'value',
  nameKey = 'date',
  variant = 'line',
  color = BRAND.chartPrimary,
  gradientFrom,
  gradientTo,
  showGrid = true,
  showLegend = false,
  height = 300,
  className,
  loading = false,
  formatYAxis,
  formatTooltip,
}: TrendChartProps) {
  const chartId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`
  const fromColor = gradientFrom || color
  const toColor = gradientTo || `${color}10`

  // Custom tooltip with glassmorphism
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendChartDataPoint; value: number }> }) => {
    if (!active || !payload || !payload[0]) return null

    const chartData = payload[0].payload
    const value = payload[0].value

    return (
      <div className="rounded-xl border border-white/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground">{chartData.label || chartData[nameKey]}</p>
        <p className="text-lg font-bold" style={{ color }}>
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
            {variant === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fromColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={toColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                {showGrid && (
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="currentColor" 
                    strokeOpacity={0.1}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey={nameKey}
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  fill={`url(#${chartId})`}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                {showGrid && (
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="currentColor" 
                    strokeOpacity={0.1}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey={nameKey}
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: color, stroke: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Multi-line Trend Chart
 * Supports multiple data series
 */
export interface MultiLineTrendChartProps {
  title: string
  description?: string
  data: Array<Record<string, string | number>>
  lines: {
    dataKey: string
    name: string
    color: string
  }[]
  nameKey?: string
  showGrid?: boolean
  height?: number
  className?: string
  loading?: boolean
  formatYAxis?: (value: number) => string
}

export function MultiLineTrendChart({
  title,
  description,
  data,
  lines,
  nameKey = 'date',
  showGrid = true,
  height = 300,
  className,
  loading = false,
  formatYAxis,
}: MultiLineTrendChartProps) {
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
            <LineChart data={data}>
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  strokeOpacity={0.1}
                  vertical={false}
                />
              )}
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
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: line.color, stroke: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: line.color, stroke: 'white', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
