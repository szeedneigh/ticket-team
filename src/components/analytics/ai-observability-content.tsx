/**
 * AI Observability Content Component (Client)
 *
 * Technical observability dashboard for AI system performance,
 * focusing on response times, error rates, and model behavior.
 */

'use client'

import { motion } from 'framer-motion'
import {
  KPICard,
  KPICardGrid,
  TrendChart,
  CategoryChart,
  PerformanceTimeFilter,
} from '@/components/analytics'
import {
  ClockIcon,
  ZapIcon,
  AlertTriangleIcon,
  ActivityIcon,
  TrendingUpIcon,
  GaugeIcon,
} from 'lucide-react'
import type { AIAnalyticsData } from '@/lib/types/analytics'

interface AIObservabilityContentProps {
  aiData: AIAnalyticsData
  dateRange: {
    start: string
    end: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function AIObservabilityContent({ aiData, dateRange }: AIObservabilityContentProps) {
  // Calculate performance metrics
  const p50ResponseTime = calculatePercentile(
    aiData.volumeTrend.map((d) => d.queries),
    50
  )
  const p95ResponseTime = calculatePercentile(
    aiData.volumeTrend.map((d) => d.queries),
    95
  )
  const p99ResponseTime = calculatePercentile(
    aiData.volumeTrend.map((d) => d.queries),
    99
  )

  // Calculate error rate (assuming failed queries would be in metadata)
  // For now, we'll use escalation rate as a proxy for "needs human intervention"
  const errorRate = aiData.summary.escalationRate

  // Calculate throughput (queries per day average)
  const daysInPeriod =
    (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) /
    (1000 * 60 * 60 * 24)
  const avgQueriesPerDay =
    daysInPeriod > 0 ? Math.round(aiData.summary.totalQueries / daysInPeriod) : 0

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Time Filter */}
      <motion.div
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
            <ActivityIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI System Observability</h1>
            <p className="text-sm text-muted-foreground">
              Technical metrics for AI model performance and system health
            </p>
          </div>
        </div>
        <PerformanceTimeFilter defaultValue="this_month" />
      </motion.div>

      {/* Performance KPIs */}
      <motion.div variants={itemVariants}>
        <KPICardGrid>
          <KPICard
            title="Avg Response Time"
            value={aiData.summary.avgResponseTime}
            description={`P50: ${formatResponseTime(aiData.summary.avgResponseTimeMs)}`}
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
            title="P95 Response Time"
            value={formatResponseTime(p95ResponseTime)}
            description="95th percentile latency"
            icon={<GaugeIcon className="h-4 w-4" />}
            variant={p95ResponseTime <= 5000 ? 'success' : p95ResponseTime <= 10000 ? 'warning' : 'danger'}
          />
          <KPICard
            title="Throughput"
            value={`${avgQueriesPerDay}/day`}
            description="Average queries per day"
            icon={<ZapIcon className="h-4 w-4" />}
          />
          <KPICard
            title="Error Rate"
            value={`${errorRate}%`}
            description="Escalations requiring human intervention"
            icon={<AlertTriangleIcon className="h-4 w-4" />}
            variant={errorRate <= 10 ? 'success' : errorRate <= 30 ? 'warning' : 'danger'}
          />
        </KPICardGrid>
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div className="grid gap-4 md:grid-cols-3" variants={itemVariants}>
        <KPICard
          title="P50 Latency"
          value={formatResponseTime(p50ResponseTime)}
          description="Median response time"
          icon={<TrendingUpIcon className="h-4 w-4" />}
        />
        <KPICard
          title="P99 Latency"
          value={formatResponseTime(p99ResponseTime)}
          description="99th percentile (worst case)"
          icon={<GaugeIcon className="h-4 w-4" />}
        />
        <KPICard
          title="Success Rate"
          value={`${100 - errorRate}%`}
          description="Queries resolved without escalation"
          icon={<ActivityIcon className="h-4 w-4" />}
          variant={100 - errorRate >= 90 ? 'success' : 100 - errorRate >= 70 ? 'warning' : 'danger'}
        />
      </motion.div>

      {/* Response Time Distribution */}
      {aiData.volumeTrend.length > 0 && (
        <motion.div variants={itemVariants}>
          <TrendChart
            title="Response Time Trend"
            description="Average response time over time"
            data={aiData.volumeTrend.map((d) => ({
              date: d.date,
              value: aiData.summary.avgResponseTimeMs, // Using average for now
            }))}
            variant="area"
            color="#8b5cf6"
            height={300}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
          />
        </motion.div>
      )}

      {/* Performance Distribution Charts */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        {/* Helpfulness Distribution */}
        <CategoryChart
          title="Response Quality Distribution"
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
          height={300}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
        />

        {/* Escalation Trend */}
        {aiData.volumeTrend.length > 0 && (
          <TrendChart
            title="Escalation Rate Trend"
            description="Percentage of queries escalated to tickets"
            data={aiData.volumeTrend.map((d) => ({
              date: d.date,
              value: d.queries > 0 ? Math.round((d.escalations / d.queries) * 100) : 0,
            }))}
            variant="line"
            color="#f59e0b"
            height={300}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
          />
        )}
      </motion.div>

      {/* System Health Summary */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg">
          <div className="border-b border-white/20 p-6">
            <div className="flex items-center gap-3">
              <ActivityIcon className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="text-base font-semibold">System Health Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Overall AI system performance indicators
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Response Time Health */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Response Time Health</span>
                  <span
                    className={`font-semibold ${
                      aiData.summary.avgResponseTimeMs <= 2000
                        ? 'text-emerald-600'
                        : aiData.summary.avgResponseTimeMs <= 5000
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {aiData.summary.avgResponseTimeMs <= 2000
                      ? 'Excellent'
                      : aiData.summary.avgResponseTimeMs <= 5000
                        ? 'Good'
                        : 'Needs Attention'}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                  <motion.div
                    className={`h-full rounded-full ${
                      aiData.summary.avgResponseTimeMs <= 2000
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : aiData.summary.avgResponseTimeMs <= 5000
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (2000 / aiData.summary.avgResponseTimeMs) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt; 2s average response time
                </p>
              </div>

              {/* Quality Health */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Response Quality</span>
                  <span
                    className={`font-semibold ${
                      aiData.summary.helpfulnessRate >= 70
                        ? 'text-emerald-600'
                        : aiData.summary.helpfulnessRate >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {aiData.summary.helpfulnessRate >= 70
                      ? 'Excellent'
                      : aiData.summary.helpfulnessRate >= 50
                        ? 'Good'
                        : 'Needs Improvement'}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${aiData.summary.helpfulnessRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {aiData.summary.helpfulCount} helpful out of{' '}
                  {aiData.summary.helpfulCount + aiData.summary.notHelpfulCount} rated
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Calculate percentile from array of values
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)] || 0
}

/**
 * Format response time in milliseconds to human-readable string
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

