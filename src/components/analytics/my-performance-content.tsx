/**
 * My Performance Content Component (Client)
 *
 * Individual staff member's personal performance dashboard
 * with professional Recharts visualizations and modern design.
 */

'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  TrendingUp,
  Target,
  Award,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { StaffPerformance } from '@/lib/types/analytics'

interface MyPerformanceContentProps {
  performance: StaffPerformance
  dateRange?: {
    start: string
    end: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Premium color palette
const COLORS = {
  primary: '#0693D2',
  emerald: '#10b981',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  red: '#ef4444',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  slate: '#64748b',
}

export function MyPerformanceContent({
  performance,
  dateRange,
}: MyPerformanceContentProps) {
  // Calculate performance insights
  const resolutionRate = performance.ticketsAssigned > 0
    ? Math.round((performance.ticketsResolved / performance.ticketsAssigned) * 100)
    : 0

  // Determine performance level based on satisfaction score
  const getPerformanceLevel = (score: number) => {
    if (score >= 4.5) return { label: 'Excellent', color: 'emerald', icon: '🌟', emoji: '🎉' }
    if (score >= 4.0) return { label: 'Great', color: 'blue', icon: '👍', emoji: '💪' }
    if (score >= 3.5) return { label: 'Good', color: 'yellow', icon: '👌', emoji: '✨' }
    if (score >= 3.0) return { label: 'Fair', color: 'orange', icon: '📊', emoji: '📈' }
    return { label: 'Needs Improvement', color: 'red', icon: '📈', emoji: '💡' }
  }

  const performanceLevel = getPerformanceLevel(performance.satisfactionScore)

  // Data for ticket breakdown donut chart
  const ticketBreakdownData = [
    { name: 'Resolved', value: performance.ticketsResolved, color: COLORS.emerald },
    { name: 'Active', value: performance.activeTickets, color: COLORS.blue },
    { name: 'Overdue', value: performance.overdueTickets, color: COLORS.red },
  ].filter(item => item.value > 0)

  // Data for satisfaction radial chart
  const satisfactionData = [
    {
      name: 'Your Score',
      value: performance.satisfactionScore,
      fill: performance.satisfactionScore >= 4.5 ? COLORS.emerald : 
            performance.satisfactionScore >= 4.0 ? COLORS.blue :
            performance.satisfactionScore >= 3.5 ? COLORS.amber : COLORS.red,
    },
  ]

  // Data for time metrics comparison
  const timeMetricsData = [
    {
      metric: 'Response',
      hours: performance.avgResponseTimeHours || 0,
      target: 2,
      fill: COLORS.purple,
    },
    {
      metric: 'Resolution',
      hours: performance.avgResolutionTimeHours || 0,
      target: 24,
      fill: COLORS.cyan,
    },
  ]

  // Data for performance metrics bar chart
  const performanceMetricsData = [
    { name: 'Assigned', value: performance.ticketsAssigned, color: COLORS.blue },
    { name: 'Resolved', value: performance.ticketsResolved, color: COLORS.emerald },
    { name: 'Active', value: performance.activeTickets, color: COLORS.amber },
    { name: 'Overdue', value: performance.overdueTickets, color: COLORS.red },
  ]

  // Custom tooltip
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean
    payload?: Array<{ 
      name?: string
      value?: number
      fill?: string
      color?: string
      payload?: { value: number; name?: string }
    }>
    label?: string
  }) => {
    if (!active || !payload || !payload[0]) return null

    return (
      <div className="rounded-xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground">{label || payload[0].name}</p>
        <p className="text-lg font-bold" style={{ color: payload[0].fill || payload[0].color }}>
          {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Performance Dashboard</h1>
            <p className="text-muted-foreground">
              Track your personal metrics and achievements
              {dateRange && (
                <span className="ml-2 text-sm">
                  ({new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Performance Badge */}
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-white/10 dark:to-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 px-6 py-4 shadow-lg">
          <span className="text-2xl">{performanceLevel.icon}</span>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Overall Performance</p>
            <p className="font-bold text-xl">{performanceLevel.label}</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tickets Resolved */}
        <Card className="border-white/30 dark:border-white/10 bg-gradient-to-br from-emerald-50/80 to-white/80 dark:from-emerald-950/20 dark:to-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Tickets Resolved</p>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shadow-md">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{performance.ticketsResolved}</p>
              {resolutionRate > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-emerald-200 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${resolutionRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{resolutionRate}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tickets Assigned */}
        <Card className="border-white/30 dark:border-white/10 bg-gradient-to-br from-blue-50/80 to-white/80 dark:from-blue-950/20 dark:to-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Tickets Assigned</p>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 shadow-md">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{performance.ticketsAssigned}</p>
              <p className="text-sm text-muted-foreground mt-2">{performance.activeTickets} currently active</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Resolution Time */}
        <Card className="border-white/30 dark:border-white/10 bg-gradient-to-br from-purple-50/80 to-white/80 dark:from-purple-950/20 dark:to-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 shadow-md">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{performance.avgResolutionTime}</p>
              {performance.avgResponseTime !== '-' && (
                <p className="text-sm text-muted-foreground mt-2">{performance.avgResponseTime} first response</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Satisfaction Score */}
        <Card className="border-white/30 dark:border-white/10 bg-gradient-to-br from-amber-50/80 to-white/80 dark:from-amber-950/20 dark:to-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 shadow-md">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {performance.satisfactionScore > 0 ? performance.satisfactionScore.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {performance.satisfactionScore > 0 ? 'out of 5.0' : 'No ratings yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alert for overdue tickets */}
      {performance.overdueTickets > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-950/20 dark:to-red-950/20 backdrop-blur-xl shadow-lg">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  ⚠️ You have {performance.overdueTickets} overdue ticket{performance.overdueTickets !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  These tickets have exceeded the 24-hour response threshold. Please prioritize them!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ticket Breakdown Donut Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Ticket Distribution
              </CardTitle>
              <CardDescription>Breakdown of your assigned tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={ticketBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ticketBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: { payload?: { value?: number } }) => (
                      <span className="text-sm">
                        {value}: <span className="font-semibold">{entry.payload?.value}</span>
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Satisfaction Score Radial Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Satisfaction Score
              </CardTitle>
              <CardDescription>Your user satisfaction rating</CardDescription>
            </CardHeader>
            <CardContent>
              {performance.satisfactionScore > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    barSize={40}
                    data={[{ ...satisfactionData[0], fill: satisfactionData[0].fill, max: 5 }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground"
                    >
                      <tspan x="50%" dy="-0.5em" fontSize="48" fontWeight="bold">
                        {performance.satisfactionScore.toFixed(1)}
                      </tspan>
                      <tspan x="50%" dy="1.5em" fontSize="16" className="fill-muted-foreground">
                        out of 5.0
                      </tspan>
                    </text>
                    <Tooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px]">
                  <div className="text-center">
                    <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No ratings yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Keep resolving tickets to get feedback!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Metrics Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ticket Metrics Overview
              </CardTitle>
              <CardDescription>Your ticket handling statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={performanceMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-muted/20" />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor" 
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-xs fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {performanceMetricsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Time Metrics Comparison */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Response & Resolution Time
              </CardTitle>
              <CardDescription>Average time metrics (in hours)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timeMetricsData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-muted/20" />
                  <XAxis 
                    type="number"
                    stroke="currentColor" 
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis 
                    type="category"
                    dataKey="metric"
                    stroke="currentColor" 
                    className="text-xs fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
                    {timeMetricsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-muted-foreground">Response Target: <span className="font-semibold text-foreground">2h</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-cyan-500" />
                  <span className="text-muted-foreground">Resolution Target: <span className="font-semibold text-foreground">24h</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Tips */}
      <motion.div variants={itemVariants}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-cyan/5 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Performance Insights & Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.avgResponseTimeHours > 2 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">💡</span>
                <p>Try to respond to tickets within 2 hours to improve your response time metric</p>
              </div>
            )}
            {performance.overdueTickets > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p>Focus on clearing overdue tickets to improve your overall performance score</p>
              </div>
            )}
            {performance.satisfactionScore < 4.5 && performance.satisfactionScore > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">📈</span>
                <p>Consider following up with users after resolution to ensure satisfaction and gather feedback</p>
              </div>
            )}
            {resolutionRate >= 80 && (
              <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <span className="mt-0.5">✅</span>
                <p className="font-medium">Excellent resolution rate! You&apos;re closing tickets efficiently</p>
              </div>
            )}
            {performance.satisfactionScore >= 4.5 && (
              <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <span className="mt-0.5">🌟</span>
                <p className="font-medium">Outstanding satisfaction score! Users love your support</p>
              </div>
            )}
            {performance.avgResponseTimeHours <= 2 && performance.avgResponseTimeHours > 0 && (
              <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <span className="mt-0.5">⚡</span>
                <p className="font-medium">Great response time! You&apos;re providing quick first responses</p>
              </div>
            )}
            {performance.overdueTickets === 0 && performance.ticketsAssigned > 0 && (
              <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <span className="mt-0.5">🎯</span>
                <p className="font-medium">Perfect! No overdue tickets - excellent time management</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
