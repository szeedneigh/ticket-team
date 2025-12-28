/**
 * AI Analytics Content Component (Client)
 *
 * Premium AI chat analytics with glassmorphism styling,
 * semantic colors, and modern visual design.
 */

'use client'

import { motion } from 'framer-motion'
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
  Bot,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Clock,
  Users,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { exportAIAnalytics } from '@/lib/analytics/export'
import type { ExportFormat, AIAnalyticsData } from '@/lib/types/analytics'

interface AIAnalyticsContentProps {
  aiData: AIAnalyticsData
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
          <p className="text-sm truncate">{value as string}</p>
        </div>
      ),
    },
    {
      key: 'count',
      label: 'Count',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {value as number}
        </Badge>
      ),
    },
    {
      key: 'avgResponseTime',
      label: 'Avg Response',
      sortable: true,
      align: 'right',
      render: (value) => {
        const ms = value as number
        return <span className="text-sm font-medium">{ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`}</span>
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
          <Badge 
            variant={rate >= 70 ? 'default' : rate >= 50 ? 'secondary' : 'outline'}
            className={rate >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
          >
            {rate}%
          </Badge>
        )
      },
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
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Chat Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Performance metrics for AI-powered support conversations
            </p>
          </div>
        </div>
        <ExportButton onExport={handleExport} />
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <KPICardGrid>
          <KPICard
            title="Total Conversations"
            value={aiData.summary.totalConversations.toLocaleString()}
            description="Unique chat sessions"
            icon={<Bot className="h-4 w-4" />}
          />
          <KPICard
            title="Total Queries"
            value={aiData.summary.totalQueries.toLocaleString()}
            description="Questions asked"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <KPICard
            title="Helpfulness Rate"
            value={`${aiData.summary.helpfulnessRate}%`}
            description={`${aiData.summary.helpfulCount} helpful / ${aiData.summary.helpfulCount + aiData.summary.notHelpfulCount} rated`}
            icon={<ThumbsUp className="h-4 w-4" />}
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
            icon={<AlertTriangle className="h-4 w-4" />}
            variant={
              aiData.summary.escalationRate <= 10
                ? 'success'
                : aiData.summary.escalationRate <= 30
                  ? 'warning'
                  : 'danger'
            }
          />
        </KPICardGrid>
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div className="grid gap-4 md:grid-cols-2" variants={itemVariants}>
        <KPICard
          title="Avg Response Time"
          value={aiData.summary.avgResponseTime}
          description="Time to generate response"
          icon={<Clock className="h-4 w-4" />}
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
          icon={<Users className="h-4 w-4" />}
        />
      </motion.div>

      {/* Volume Trend */}
      {aiData.volumeTrend.length > 0 && (
        <motion.div variants={itemVariants}>
          <TrendChart
            title="Conversation Volume Trend"
            description="Daily AI chat usage"
            data={aiData.volumeTrend.map((d) => ({
              date: d.date,
              value: d.queries,
            }))}
            variant="area"
            color="#0693D2"
            height={320}
          />
        </motion.div>
      )}

      {/* Charts Row */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
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
              color: '#94a3b8',
            },
          ]}
          variant="donut"
          showLegend={true}
          height={320}
          centerLabel="Total Rated"
          centerValue={aiData.helpfulnessDistribution.helpful + aiData.helpfulnessDistribution.notHelpful}
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
            color="#f59e0b"
            height={320}
          />
        )}
      </motion.div>

      {/* Common Queries Table */}
      <motion.div variants={itemVariants}>
        {aiData.commonQueries.length > 0 ? (
          <DataTable
            title="Most Common Queries"
            description="Frequently asked questions and their performance"
            columns={queryColumns}
            data={aiData.commonQueries as unknown as Array<Record<string, unknown>>}
            showPagination={false}
          />
        ) : (
          <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-12 text-center shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No Common Queries Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Common queries will appear here once users start having repeated questions
            </p>
          </div>
        )}
      </motion.div>

      {/* Performance Summary */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg">
          <div className="border-b border-white/20 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#0693D2]" />
              <div>
                <h3 className="text-base font-semibold">Performance Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Key metrics for AI chat effectiveness
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Helpfulness Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">Helpfulness Rate</span>
                  </div>
                  <span className="font-semibold">{aiData.summary.helpfulnessRate}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${aiData.summary.helpfulnessRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Self-Service Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Self-Service Rate</span>
                  </div>
                  <span className="font-semibold">{100 - aiData.summary.escalationRate}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - aiData.summary.escalationRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of queries resolved without creating a ticket
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 pt-4 border-t border-white/20 md:grid-cols-3">
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {aiData.summary.helpfulCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Helpful Responses</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/30">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {aiData.summary.notHelpfulCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Not Helpful</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {aiData.helpfulnessDistribution.noFeedback}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">No Feedback</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
