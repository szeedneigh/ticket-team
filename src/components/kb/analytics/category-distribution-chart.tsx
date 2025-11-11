/**
 * Category Distribution Chart Component
 *
 * Pie chart showing the distribution of articles across categories.
 * Uses Recharts for responsive, interactive visualization.
 */

'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CategoryData {
  category: string
  count: number
  percentage: number
  [key: string]: string | number
}

interface CategoryDistributionChartProps {
  data: CategoryData[]
}

// Color palette for categories (matching KB browse page)
const CATEGORY_COLORS: Record<string, string> = {
  'Technical': '#3B82F6',      // Blue
  'Account': '#A855F7',         // Purple
  'Enrollment': '#10B981',      // Green
  'General': '#6B7280',         // Gray
  'Financial': '#F59E0B',       // Amber
  'Academic': '#EF4444'         // Red
}

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  // Get color for category
  const getColor = (category: string) => {
    return CATEGORY_COLORS[category] || '#6B7280'
  }

  // Custom label for pie slices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (props: any) => {
    return props.percentage ? `${props.percentage}%` : ''
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="text-sm font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            Articles: <span className="font-semibold">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-semibold">{data.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-sm">
        {payload?.map((entry: { value: string; color: string }, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No articles to display
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>
          Article distribution across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={renderCustomLabel}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.category)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
