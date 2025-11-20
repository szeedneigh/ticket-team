/**
 * Trend Chart Component
 *
 * Line and area charts for visualizing trends over time.
 * Uses Recharts for rendering.
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

export interface TrendChartDataPoint {
  date: string
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
  color = 'hsl(var(--primary))',
  showGrid = true,
  showLegend = false,
  height = 300,
  className,
  loading = false,
  formatYAxis,
  formatTooltip,
}: TrendChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendChartDataPoint; value: number }> }) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload
    const value = payload[0].value

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">{data.label || data[nameKey]}</p>
        <p className="text-sm text-muted-foreground">
          {formatTooltip ? formatTooltip(value) : value}
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
            <div className="h-32 w-32 animate-pulse rounded bg-muted" />
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
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                )}
                <XAxis
                  dataKey={nameKey}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                )}
                <XAxis
                  dataKey={nameKey}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
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
            <div className="h-32 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              )}
              <XAxis
                dataKey={nameKey}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={formatYAxis}
              />
              <Tooltip />
              <Legend />
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
