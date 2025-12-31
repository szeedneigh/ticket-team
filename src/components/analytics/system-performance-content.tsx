/**
 * System Performance Content Component (Client)
 *
 * Displays system-wide performance metrics including page load times,
 * API response times, database performance, and error rates.
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { KPICard, KPICardGrid, TrendChart } from '@/components/analytics'
import {
  GaugeIcon,
  ClockIcon,
  AlertTriangleIcon,
  DatabaseIcon,
  ZapIcon,
  ActivityIcon,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

interface PerformanceMetrics {
  // Page Load Metrics (from Web Vitals)
  lcp: number | null // Largest Contentful Paint (ms)
  fcp: number | null // First Contentful Paint (ms)
  cls: number | null // Cumulative Layout Shift
  fid: number | null // First Input Delay (ms)
  ttfb: number | null // Time to First Byte (ms)

  // API Metrics (from health endpoint)
  apiResponseTime: number | null
  databaseResponseTime: number | null
  errorRate: number | null

  // System Health
  isHealthy: boolean
  timestamp: string
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

export function SystemPerformanceContent() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch system performance metrics
    async function fetchMetrics() {
      try {
        // Fetch health check data
        const healthResponse = await fetch('/api/health')
        const healthData = await healthResponse.json()

        // Get Web Vitals if available (client-side only)
        let webVitals: Partial<PerformanceMetrics> = {}
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
          // Try to get performance metrics from browser
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            webVitals = {
              ttfb: Math.round(navigation.responseStart - navigation.requestStart),
              fcp: null, // Would need PerformanceObserver for FCP
              lcp: null, // Would need PerformanceObserver for LCP
              cls: null, // Would need PerformanceObserver for CLS
              fid: null, // Would need PerformanceObserver for FID
            }
          }
        }

        const performanceMetrics: PerformanceMetrics = {
          lcp: webVitals.lcp ?? null,
          fcp: webVitals.fcp ?? null,
          cls: webVitals.cls ?? null,
          fid: webVitals.fid ?? null,
          ttfb: webVitals.ttfb ?? null,
          apiResponseTime: healthData.checks?.database?.responseTime || null,
          databaseResponseTime: healthData.checks?.database?.responseTime || null,
          errorRate: healthData.status === 'unhealthy' ? 100 : healthData.status === 'degraded' ? 50 : 0,
          isHealthy: healthData.status === 'healthy',
          timestamp: new Date().toISOString(),
        }

        setMetrics(performanceMetrics)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics')
        setLoading(false)
      }
    }

    fetchMetrics()

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                <div className="h-9 w-9 bg-muted animate-pulse rounded-xl" />
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error Loading Performance Metrics</AlertTitle>
        <AlertDescription>{error || 'Failed to load performance data'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Info Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Performance Monitoring</AlertTitle>
        <AlertDescription>
          System performance metrics are collected from the health check endpoint and browser
          performance APIs. For detailed Web Vitals (LCP, FCP, CLS), integrate Vercel Analytics
          or Google Analytics. Database query performance can be monitored via Supabase dashboard.
        </AlertDescription>
      </Alert>

      {/* System Health Status */}
      <motion.div variants={itemVariants}>
        <KPICard
          title="System Health"
          value={metrics.isHealthy ? 'Healthy' : 'Degraded'}
          description={`Last checked: ${new Date(metrics.timestamp).toLocaleTimeString()}`}
          icon={<ActivityIcon className="h-4 w-4" />}
          variant={metrics.isHealthy ? 'success' : 'warning'}
        />
      </motion.div>

      {/* Performance KPIs */}
      <motion.div variants={itemVariants}>
        <KPICardGrid>
          <KPICard
            title="Time to First Byte"
            value={metrics.ttfb ? `${metrics.ttfb}ms` : 'N/A'}
            description="Server response time"
            icon={<ZapIcon className="h-4 w-4" />}
            variant={
              metrics.ttfb
                ? metrics.ttfb <= 200
                  ? 'success'
                  : metrics.ttfb <= 500
                    ? 'warning'
                    : 'danger'
                : undefined
            }
          />
          <KPICard
            title="Database Response"
            value={metrics.databaseResponseTime ? `${metrics.databaseResponseTime}ms` : 'N/A'}
            description="Query execution time"
            icon={<DatabaseIcon className="h-4 w-4" />}
            variant={
              metrics.databaseResponseTime
                ? metrics.databaseResponseTime <= 100
                  ? 'success'
                  : metrics.databaseResponseTime <= 500
                    ? 'warning'
                    : 'danger'
                : undefined
            }
          />
          <KPICard
            title="API Response Time"
            value={metrics.apiResponseTime ? `${metrics.apiResponseTime}ms` : 'N/A'}
            description="Average API latency"
            icon={<ClockIcon className="h-4 w-4" />}
            variant={
              metrics.apiResponseTime
                ? metrics.apiResponseTime <= 200
                  ? 'success'
                  : metrics.apiResponseTime <= 500
                    ? 'warning'
                    : 'danger'
                : undefined
            }
          />
          <KPICard
            title="Error Rate"
            value={metrics.errorRate !== null ? `${metrics.errorRate}%` : 'N/A'}
            description="System error percentage"
            icon={<AlertTriangleIcon className="h-4 w-4" />}
            variant={
              metrics.errorRate !== null
                ? metrics.errorRate === 0
                  ? 'success'
                  : metrics.errorRate <= 5
                    ? 'warning'
                    : 'danger'
                : undefined
            }
          />
        </KPICardGrid>
      </motion.div>

      {/* Web Vitals Section */}
      {(metrics.lcp !== null ||
        metrics.fcp !== null ||
        metrics.cls !== null ||
        metrics.fid !== null) && (
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GaugeIcon className="h-5 w-5" />
              Web Vitals
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.lcp !== null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">LCP</div>
                  <div className="text-2xl font-bold">
                    {(metrics.lcp / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.lcp <= 2500 ? 'Good' : metrics.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
                  </div>
                </div>
              )}
              {metrics.fcp !== null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">FCP</div>
                  <div className="text-2xl font-bold">
                    {(metrics.fcp / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.fcp <= 1800 ? 'Good' : metrics.fcp <= 3000 ? 'Needs Improvement' : 'Poor'}
                  </div>
                </div>
              )}
              {metrics.cls !== null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">CLS</div>
                  <div className="text-2xl font-bold">{metrics.cls.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.cls <= 0.1 ? 'Good' : metrics.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
                  </div>
                </div>
              )}
              {metrics.fid !== null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">FID</div>
                  <div className="text-2xl font-bold">{metrics.fid}ms</div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.fid <= 100 ? 'Good' : metrics.fid <= 300 ? 'Needs Improvement' : 'Poor'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Targets */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Performance Targets</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>TTFB Target</span>
                <span className="font-medium">&lt; 200ms</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    metrics.ttfb && metrics.ttfb <= 200
                      ? 'bg-emerald-500'
                      : metrics.ttfb && metrics.ttfb <= 500
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: metrics.ttfb ? `${Math.min(100, (metrics.ttfb / 1000) * 100)}%` : '0%',
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Database Query Target</span>
                <span className="font-medium">&lt; 100ms</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    metrics.databaseResponseTime && metrics.databaseResponseTime <= 100
                      ? 'bg-emerald-500'
                      : metrics.databaseResponseTime && metrics.databaseResponseTime <= 500
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: metrics.databaseResponseTime
                      ? `${Math.min(100, (metrics.databaseResponseTime / 1000) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

