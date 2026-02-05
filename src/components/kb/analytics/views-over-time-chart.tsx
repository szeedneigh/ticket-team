/**
 * Views Over Time Chart Component
 *
 * Line chart showing article views over the last N days.
 * Uses Recharts for responsive, interactive visualization.
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BRAND } from '@/lib/constants/colors'

interface ViewsData {
  date: string
  views: number
}

interface ViewsOverTimeChartProps {
  data: ViewsData[]
  days?: number
}

export function ViewsOverTimeChart({ data, days = 30 }: ViewsOverTimeChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ViewsData; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="text-sm font-medium">{formatDate(payload[0].payload.date)}</p>
          <p className="text-sm text-muted-foreground">
            Views: <span className="font-semibold" style={{ color: BRAND.chartPrimary }}>{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Views Over Time</CardTitle>
        <CardDescription>
          Article views in the last {days} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs"
              stroke="currentColor"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              stroke="currentColor"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              stroke={BRAND.chartPrimary}
              strokeWidth={2}
              dot={{ fill: BRAND.chartPrimary, r: 3 }}
              activeDot={{ r: 5 }}
              name="Views"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
