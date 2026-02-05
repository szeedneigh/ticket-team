/**
 * Satisfaction Content Component (Client)
 *
 * Premium satisfaction analytics with glassmorphism styling,
 * emoji-based satisfaction ratings, and modern visual design.
 */

'use client'

import { motion } from 'framer-motion'
import {
  KPICard,
  KPICardGrid,
  CategoryChart,
  BarChart,
  DataTable,
  ExportButton,
} from '@/components/analytics'
import type { DataTableColumn } from '@/components/analytics'
import { MessageSquareIcon, TrendingUpIcon, HeartIcon, SmileIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { exportSatisfactionAnalytics } from '@/lib/analytics/export'
import type { ExportFormat } from '@/lib/types/analytics'
import { getSatisfactionRatingColor, STATUS } from '@/lib/constants/colors'
import { getSatisfactionEmoji } from '@/lib/constants/satisfaction-emojis'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
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

  // Define table columns for recent feedback
  const feedbackColumns: DataTableColumn[] = [
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="text-xl" role="img" aria-label={`Rating ${value} of 5`}>
          {getSatisfactionEmoji(value as number)}
        </span>
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
        const r = Math.round(score)
        return (
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg" role="img" aria-hidden="true">{getSatisfactionEmoji(r)}</span>
            <Badge
              variant={score >= 4 ? 'default' : score >= 3 ? 'secondary' : 'destructive'}
              className={score >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
            >
              {score.toFixed(1)}/5.0
            </Badge>
          </div>
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
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
            <HeartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Satisfaction Analytics</h1>
            <p className="text-muted-foreground">
              Customer feedback and satisfaction metrics
            </p>
          </div>
        </div>
        <ExportButton onExport={handleExport} />
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <KPICardGrid>
          <KPICard
            title="Overall Score"
            value={`${satisfactionData.overallScore.toFixed(1)}/5.0`}
            description="Average satisfaction rating"
            icon={<span className="text-lg" aria-hidden="true">{getSatisfactionEmoji(Math.round(satisfactionData.overallScore))}</span>}
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
            description="Rated 4-5"
            icon={<TrendingUpIcon className="h-4 w-4" />}
            variant={promotersScore >= 75 ? 'success' : promotersScore >= 50 ? 'warning' : 'danger'}
          />
          <KPICard
            title="Negative Feedback"
            value={negativeResponses.toLocaleString()}
            description="Rated 1-2"
            icon={<SmileIcon className="h-4 w-4" />}
            variant={negativeResponses === 0 ? 'success' : negativeResponses < 5 ? 'warning' : 'danger'}
          />
        </KPICardGrid>
      </motion.div>

      {/* Charts Row */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        {/* Rating Distribution */}
        <CategoryChart
          title="Rating Distribution"
          description="Breakdown of satisfaction ratings"
          data={satisfactionData.distribution.map((d) => ({
            name: `${getSatisfactionEmoji(d.rating)} ${d.rating}`,
            value: d.count,
            color: getSatisfactionRatingColor(d.rating),
          }))}
          variant="donut"
          showLegend={true}
          height={320}
          centerLabel="Responses"
          centerValue={satisfactionData.totalResponses}
        />

        {/* Category Satisfaction */}
        <BarChart
          title="Satisfaction by Category"
          description="Average rating per category"
          data={satisfactionData.byCategory.map((c) => ({
            name: c.category,
            value: c.score,
            color: getSatisfactionRatingColor(Math.round(c.score)),
          }))}
          dataKey="value"
          nameKey="name"
          orientation="horizontal"
          height={320}
          color={STATUS.purple}
          formatTooltip={(value) => `${value.toFixed(1)}/5.0`}
        />
      </motion.div>

      {/* Rating Breakdown Visual */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg">
          <div className="border-b border-white/20 p-6">
            <h3 className="text-base font-semibold">Rating Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Detailed distribution of satisfaction ratings
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {satisfactionData.distribution
                .sort((a, b) => b.rating - a.rating)
                .map((dist) => (
                  <div key={dist.rating} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl" role="img" aria-hidden="true">{getSatisfactionEmoji(dist.rating)}</span>
                        <span className="font-medium">Rating {dist.rating}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{dist.count}</span>
                        <span className="text-muted-foreground w-12 text-right">
                          ({dist.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getSatisfactionRatingColor(dist.rating) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${dist.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Satisfaction Table */}
      <motion.div variants={itemVariants}>
        <DataTable
          title="Category Performance"
          description="Satisfaction scores by ticket category"
          columns={categoryColumns}
          data={satisfactionData.byCategory}
          showPagination={false}
        />
      </motion.div>

      {/* Recent Feedback */}
      <motion.div variants={itemVariants}>
        <DataTable
          title="Recent Feedback"
          description="Latest customer feedback submissions"
          columns={feedbackColumns}
          data={satisfactionData.recentFeedback}
          showPagination={true}
          pageSize={5}
        />
      </motion.div>
    </motion.div>
  )
}
