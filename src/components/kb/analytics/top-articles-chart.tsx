/**
 * Top Articles Chart Component
 *
 * Bar chart showing the top articles by view count.
 * Uses Recharts for responsive, interactive visualization.
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TopArticle {
  id: string
  title: string
  view_count: number
  category: string
}

interface TopArticlesChartProps {
  data: TopArticle[]
  limit?: number
}

export function TopArticlesChart({ data, limit = 10 }: TopArticlesChartProps) {
  // Truncate long titles
  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  // Prepare data for chart
  const chartData = data.map(article => ({
    ...article,
    displayTitle: truncateTitle(article.title, 25)
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TopArticle & { displayTitle: string }; value: number }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md max-w-xs">
          <p className="text-sm font-medium line-clamp-2">{data.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.category}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Views: <span className="font-semibold text-[#0693D2]">{data.view_count}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Articles</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            No articles to display
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top {limit} Articles</CardTitle>
        <CardDescription>
          Most viewed articles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              stroke="currentColor"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              type="category"
              dataKey="displayTitle"
              className="text-xs"
              stroke="currentColor"
              tick={{ fill: 'currentColor' }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="view_count"
              fill="#0693D2"
              radius={[0, 4, 4, 0]}
              name="Views"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
