/**
 * Bar Chart Component
 *
 * Horizontal and vertical bar charts for comparisons.
 * Uses Recharts for rendering.
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
} from 'recharts'
import { cn } from '@/lib/utils'

export interface BarChartDataPoint {
  name?: string
  value?: number
  [key: string]: string | number | undefined // Support for multiple bars and custom keys
}

export interface BarChartProps {
  title: string
  description?: string
  data: BarChartDataPoint[]
  dataKey?: string
  nameKey?: string
  orientation?: 'vertical' | 'horizontal'
  color?: string
  showGrid?: boolean
  showLegend?: boolean
  height?: number
  className?: string
  loading?: boolean
  formatYAxis?: (value: number) => string
  formatXAxis?: (value: string) => string
  formatTooltip?: (value: number) => string
}

export function BarChart({
  title,
  description,
  data,
  dataKey = 'value',
  nameKey = 'name',
  orientation = 'vertical',
  color = 'hsl(var(--primary))',
  showGrid = true,
  showLegend = false,
  height = 300,
  className,
  loading = false,
  formatYAxis,
  formatXAxis,
  formatTooltip,
}: BarChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BarChartDataPoint; value: number }> }) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload
    const value = payload[0].value

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">{data[nameKey]}</p>
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
            <RechartsBarChart
              data={data}
              layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              )}
              {orientation === 'vertical' ? (
                <>
                  <XAxis
                    dataKey={nameKey}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={formatXAxis}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={formatYAxis}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={formatYAxis}
                  />
                  <YAxis
                    dataKey={nameKey}
                    type="category"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    width={100}
                  />
                </>
              )}
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
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
            <RechartsBarChart
              data={data}
              layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              )}
              {orientation === 'vertical' ? (
                <>
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
                </>
              ) : (
                <>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={formatYAxis}
                  />
                  <YAxis
                    dataKey={nameKey}
                    type="category"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    width={100}
                  />
                </>
              )}
              <Tooltip />
              <Legend />
              {bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  stackId="stack"
                  fill={bar.color}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
