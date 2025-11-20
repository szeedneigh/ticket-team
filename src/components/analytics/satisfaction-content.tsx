/**
 * Satisfaction Content Component (Client)
 *
 * Contains interactive charts and data tables with custom formatters.
 * Extracted as a client component to avoid passing functions from server to client.
 */

'use client'

import {
  KPICard,
  KPICardGrid,
  CategoryChart,
  BarChart,
  DataTable,
  ExportButton,
} from '@/components/analytics'
import type { DataTableColumn } from '@/components/analytics'
import { StarIcon, MessageSquareIcon, TrendingUpIcon, HeartIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { exportSatisfactionAnalytics } from '@/lib/analytics/export'
import type { ExportFormat } from '@/lib/types/analytics'

interface SatisfactionContentProps {
  satisfactionData: {
    overallScore: number
    totalResponses: number
    distribution: Array<{
      rating: number
      count: number
      percentage: number
    }>
    byCategory: Array<{
      category: string
      score: number
      responses: number
    }>
    recentFeedback: Array<{
      rating: number
      comment: string | null
      createdAt: string
    }>
  }
}

export function SatisfactionContent({ satisfactionData }: SatisfactionContentProps) {
  // Calculate additional metrics
  const positiveResponses = satisfactionData.distribution
    .filter((d) => d.rating >= 4)
    .reduce((sum, d) => sum + d.count, 0)
  const negativeResponses = satisfactionData.distribution
    .filter((d) => d.rating <= 2)
    .reduce((sum, d) => sum + d.count, 0)
  const promotersScore =
    satisfactionData.totalResponses > 0
      ? Math.round((positiveResponses / satisfactionData.totalResponses) * 100)
      : 0

  const handleExport = async (format: ExportFormat) => {
    exportSatisfactionAnalytics(format, {
      breakdown: {
        overallScore: satisfactionData.overallScore,
        totalResponses: satisfactionData.totalResponses,
        distribution: satisfactionData.distribution,
        byCategory: satisfactionData.byCategory,
        recentFeedback: satisfactionData.recentFeedback.map(f => ({
          id: '',
          rating: f.rating,
          comment: f.comment,
          ticketId: '',
          createdAt: f.createdAt,
        })),
      },
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    })
  }

  // Define table columns for recent feedback (must be in client component)
  const feedbackColumns: DataTableColumn[] = [
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className={`h-4 w-4 ${
                i < (value as number)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'Feedback',
      sortable: false,
      render: (value) => (
        <div className="max-w-md truncate">
          {(value as string) || (
            <span className="text-muted-foreground italic">No comment provided</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(value as string), { addSuffix: true })}
        </span>
      ),
    },
  ]

  // Define table columns for category satisfaction
  const categoryColumns: DataTableColumn[] = [
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'score',
      label: 'Avg Score',
      sortable: true,
      align: 'center',
      render: (value) => {
        const score = value as number
        return (
          <Badge
            variant={score >= 4 ? 'default' : score >= 3 ? 'secondary' : 'destructive'}
          >
            {score.toFixed(1)}/5.0
          </Badge>
        )
      },
    },
    {
      key: 'responses',
      label: 'Responses',
      sortable: true,
      align: 'right',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Satisfaction Analytics
          </h1>
          <p className="text-muted-foreground">
            Customer feedback and satisfaction metrics
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* KPI Cards */}
      <KPICardGrid>
        <KPICard
          title="Overall Score"
          value={`${satisfactionData.overallScore.toFixed(1)}/5.0`}
          description="Average satisfaction rating"
          icon={<StarIcon className="h-4 w-4" />}
          variant={
            satisfactionData.overallScore >= 4
              ? 'success'
              : satisfactionData.overallScore >= 3
                ? 'warning'
                : 'danger'
          }
        />
        <KPICard
          title="Total Responses"
          value={satisfactionData.totalResponses.toLocaleString()}
          description="Feedback submissions"
          icon={<MessageSquareIcon className="h-4 w-4" />}
        />
        <KPICard
          title="Promoters"
          value={`${promotersScore}%`}
          description="Rated 4-5 stars"
          icon={<TrendingUpIcon className="h-4 w-4" />}
          variant={promotersScore >= 75 ? 'success' : promotersScore >= 50 ? 'warning' : 'danger'}
        />
        <KPICard
          title="Negative Feedback"
          value={negativeResponses.toLocaleString()}
          description="Rated 1-2 stars"
          icon={<HeartIcon className="h-4 w-4" />}
          variant={negativeResponses === 0 ? 'success' : negativeResponses < 5 ? 'warning' : 'danger'}
        />
      </KPICardGrid>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating Distribution */}
        <CategoryChart
          title="Rating Distribution"
          description="Breakdown of satisfaction ratings"
          data={satisfactionData.distribution.map((d) => ({
            name: `${d.rating} Star${d.rating !== 1 ? 's' : ''}`,
            value: d.count,
            color:
              d.rating >= 4
                ? '#10b981'
                : d.rating === 3
                  ? '#f59e0b'
                  : '#ef4444',
          }))}
          variant="donut"
          showLegend={true}
          height={300}
        />

        {/* Category Satisfaction */}
        <BarChart
          title="Satisfaction by Category"
          description="Average rating per category"
          data={satisfactionData.byCategory.map((c) => ({
            name: c.category,
            value: c.score,
          }))}
          dataKey="value"
          nameKey="name"
          orientation="horizontal"
          height={300}
          color="hsl(var(--chart-2))"
          formatTooltip={(value) => `${value.toFixed(1)}/5.0`}
        />
      </div>

      {/* Category Satisfaction Table */}
      <DataTable
        title="Category Performance"
        description="Satisfaction scores by ticket category"
        columns={categoryColumns}
        data={satisfactionData.byCategory}
        showPagination={false}
      />

      {/* Recent Feedback */}
      <DataTable
        title="Recent Feedback"
        description="Latest customer feedback submissions"
        columns={feedbackColumns}
        data={satisfactionData.recentFeedback}
        showPagination={true}
        pageSize={5}
      />

      {/* Rating Distribution Details */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Rating Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            Detailed distribution of satisfaction ratings
          </p>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {satisfactionData.distribution
              .sort((a, b) => b.rating - a.rating)
              .map((dist) => (
                <div key={dist.rating} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < dist.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{dist.rating} Star{dist.rating !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dist.count}</span>
                      <span className="text-muted-foreground">
                        ({dist.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

