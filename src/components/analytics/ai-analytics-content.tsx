/**
 * AI Analytics Content Component (Client)
 *
 * Contains interactive charts and data tables with custom formatters.
 * Extracted as a client component to avoid passing functions from server to client.
 */

'use client'

import {
  KPICard,
  KPICardGrid,
  TrendChart,
  CategoryChart,
  DataTable,
  ExportButton,
} from '@/components/analytics'
import type { DataTableColumn } from '@/components/analytics'
import {
  BotIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  AlertTriangleIcon,
  ClockIcon,
  UsersIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { exportAIAnalytics } from '@/lib/analytics/export'
import type { ExportFormat, AIAnalyticsData } from '@/lib/types/analytics'

interface AIAnalyticsContentProps {
  aiData: AIAnalyticsData
}

export function AIAnalyticsContent({ aiData }: AIAnalyticsContentProps) {
  const handleExport = async (format: ExportFormat) => {
    exportAIAnalytics(format, aiData)
  }

  // Define table columns for common queries
  const queryColumns: DataTableColumn[] = [
    {
      key: 'query',
      label: 'Query',
      sortable: false,
      render: (value) => (
        <div className="max-w-md">
          <p className="text-sm">{value as string}</p>
        </div>
      ),
    },
    {
      key: 'count',
      label: 'Count',
      sortable: true,
      align: 'center',
      render: (value) => <Badge variant="secondary">{value as number}</Badge>,
    },
    {
      key: 'avgResponseTime',
      label: 'Avg Response',
      sortable: true,
      align: 'right',
      render: (value) => {
        const ms = value as number
        return <span className="text-sm">{ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`}</span>
      },
    },
    {
      key: 'helpfulnessRate',
      label: 'Helpful',
      sortable: true,
      align: 'right',
      render: (value) => {
        const rate = value as number
        return (
          <Badge variant={rate >= 70 ? 'default' : rate >= 50 ? 'secondary' : 'outline'}>
            {rate}%
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics for AI-powered support conversations
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* KPI Cards */}
      <KPICardGrid>
        <KPICard
          title="Total Conversations"
          value={aiData.summary.totalConversations.toLocaleString()}
          description="Unique chat sessions"
          icon={<BotIcon className="h-4 w-4" />}
        />
        <KPICard
          title="Total Queries"
          value={aiData.summary.totalQueries.toLocaleString()}
          description="Questions asked"
          icon={<MessageSquareIcon className="h-4 w-4" />}
        />
        <KPICard
          title="Helpfulness Rate"
          value={`${aiData.summary.helpfulnessRate}%`}
          description={`${aiData.summary.helpfulCount} helpful / ${aiData.summary.helpfulCount + aiData.summary.notHelpfulCount} rated`}
          icon={<ThumbsUpIcon className="h-4 w-4" />}
          variant={
            aiData.summary.helpfulnessRate >= 70
              ? 'success'
              : aiData.summary.helpfulnessRate >= 50
                ? 'warning'
                : 'danger'
          }
        />
        <KPICard
          title="Escalation Rate"
          value={`${aiData.summary.escalationRate}%`}
          description="Escalated to tickets"
          icon={<AlertTriangleIcon className="h-4 w-4" />}
          variant={
            aiData.summary.escalationRate <= 10
              ? 'success'
              : aiData.summary.escalationRate <= 30
                ? 'warning'
                : 'danger'
          }
        />
      </KPICardGrid>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <KPICard
          title="Avg Response Time"
          value={aiData.summary.avgResponseTime}
          description="Time to generate response"
          icon={<ClockIcon className="h-4 w-4" />}
          variant={
            aiData.summary.avgResponseTimeMs <= 2000
              ? 'success'
              : aiData.summary.avgResponseTimeMs <= 5000
                ? 'warning'
                : 'danger'
          }
        />
        <KPICard
          title="Unique Users"
          value={aiData.summary.uniqueUsers.toLocaleString()}
          description="Users who used AI chat"
          icon={<UsersIcon className="h-4 w-4" />}
        />
      </div>

      {/* Volume Trend */}
      {aiData.volumeTrend.length > 0 && (
        <TrendChart
          title="Conversation Volume Trend"
          description="Daily AI chat usage"
          data={aiData.volumeTrend.map((d) => ({
            date: d.date,
            value: d.queries,
          }))}
          variant="area"
          color="hsl(var(--primary))"
          height={300}
        />
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Helpfulness Distribution */}
        <CategoryChart
          title="Feedback Distribution"
          description="User feedback on AI responses"
          data={[
            {
              name: 'Helpful',
              value: aiData.helpfulnessDistribution.helpful,
              color: '#10b981',
            },
            {
              name: 'Not Helpful',
              value: aiData.helpfulnessDistribution.notHelpful,
              color: '#ef4444',
            },
            {
              name: 'No Feedback',
              value: aiData.helpfulnessDistribution.noFeedback,
              color: '#6b7280',
            },
          ]}
          variant="donut"
          showLegend={true}
          height={300}
        />

        {/* Escalation Trend if we have volume data */}
        {aiData.volumeTrend.length > 0 && (
          <TrendChart
            title="Escalation Trend"
            description="Conversations escalated to tickets"
            data={aiData.volumeTrend.map((d) => ({
              date: d.date,
              value: d.escalations,
            }))}
            variant="line"
            color="hsl(var(--chart-3))"
            height={300}
          />
        )}
      </div>

      {/* Common Queries Table */}
      {aiData.commonQueries.length > 0 ? (
        <DataTable
          title="Most Common Queries"
          description="Frequently asked questions and their performance"
          columns={queryColumns}
          data={aiData.commonQueries as unknown as Array<Record<string, unknown>>}
          showPagination={false}
        />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <BotIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Common Queries Yet</h3>
          <p className="text-sm text-muted-foreground">
            Common queries will appear here once users start having repeated questions
          </p>
        </div>
      )}

      {/* Performance Summary */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Performance Summary</h3>
          <p className="text-sm text-muted-foreground">
            Key metrics for AI chat effectiveness
          </p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {/* Helpfulness Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Helpfulness Rate</span>
                <span>{aiData.summary.helpfulnessRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${aiData.summary.helpfulnessRate}%` }}
                />
              </div>
            </div>

            {/* Escalation Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Self-Service Rate</span>
                <span>{100 - aiData.summary.escalationRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${100 - aiData.summary.escalationRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Percentage of queries resolved without creating a ticket
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mt-4 grid gap-4 pt-4 border-t md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {aiData.summary.helpfulCount}
                </p>
                <p className="text-sm text-muted-foreground">Helpful Responses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {aiData.summary.notHelpfulCount}
                </p>
                <p className="text-sm text-muted-foreground">Not Helpful</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {aiData.helpfulnessDistribution.noFeedback}
                </p>
                <p className="text-sm text-muted-foreground">No Feedback</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
