/**
 * My Performance Content Component (Client)
 *
 * Professional "Bento Grid" style dashboard for staff performance.
 * Features:
 * - Smart KPI cards with simulated trend sparklines
 * - Ticket Velocity Area Chart
 * - Skills Radar
 * - Activity Heatmap
 */

'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Star,
  Zap,
  Ticket,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import type { StaffPerformance } from '@/lib/types/analytics'
import { Sparkline } from './sparkline'

interface MyPerformanceContentProps {
  performance: StaffPerformance
  dateRange?: {
    start: string
    end: string
  }
}



const COLORS = {
  primary: '#2cafdd', // Brand Blue
  secondary: '#1f3463', // Brand Navy
  emerald: '#10b981',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  rose: '#f43f5e',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}

export function MyPerformanceContent({ performance }: MyPerformanceContentProps) {
  // Use real daily metrics for trends
  const dailyMetrics = performance.dailyMetrics || []

  // Safe fallback if no data
  const resolvedTrend = dailyMetrics.length > 0 
    ? dailyMetrics.map(d => d.resolved) 
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  const assignedTrend = dailyMetrics.length > 0 
    ? dailyMetrics.map(d => d.assigned) 
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  
  const responseTimeTrend = dailyMetrics.length > 0
    ? dailyMetrics.map(d => d.avgResponseTime)
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  
  const satisfactionTrend = dailyMetrics.length > 0
    ? dailyMetrics.map(d => d.satisfactionScore || 5) // Default to 5 visually if no ratings
    : [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]

  // Activity Data for Heatmap & Velocity (Last 14 days or available range)
  const activityData = dailyMetrics.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    fullDate: d.date,
    resolved: d.resolved,
    assigned: d.assigned
  }))

  // Radar Chart Data (Skills Shape)
  const skillsData = [
    { subject: 'Speed', A: performance.avgResponseTimeHours > 0 && performance.avgResponseTimeHours < 2 ? 90 : 70, fullMark: 100 },
    { subject: 'Quality', A: (performance.satisfactionScore / 5) * 100, fullMark: 100 },
    { subject: 'Volume', A: Math.min(performance.ticketsResolved * 5, 100), fullMark: 100 }, // Scaled
    { subject: 'Consistency', A: dailyMetrics.filter(d => d.resolved > 0).length / Math.max(dailyMetrics.length, 1) * 100, fullMark: 100 },
    { subject: 'Empathy', A: 90, fullMark: 100 }, // Static/Subjective placeholder for now
  ]

  // Velocity Area Chart Data
  const velocityData = dailyMetrics.map(d => ({
    name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    assigned: d.assigned,
    resolved: d.resolved
  }))

  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: {
    active?: boolean
    payload?: Array<{
      name?: string
      value?: number | string
      fill?: string
      color?: string
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm p-3 shadow-xl text-xs">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="capitalize text-muted-foreground">{p.name}:</span>
              <span className="font-mono font-medium">{p.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-auto"
    >
      {/* 
        BENTO GRID LAYOUT 
        Row 1: 4 KPI Cards (3 cols each on LG)
      */}
      
      {/* KPI 1: Resolved */}
      <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-3">
        <Card className="h-full border-none bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-500/5 hover:bg-emerald-500/5 transition-colors relative overflow-hidden group">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +12%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <h3 className="text-3xl font-bold tracking-tight">{performance.ticketsResolved}</h3>
            </div>
            <div className="h-[40px] mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkline data={resolvedTrend} color={COLORS.emerald} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI 2: Assigned */}
      <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-3">
        <Card className="h-full border-none bg-gradient-to-br from-[#2cafdd]/10 to-transparent dark:from-[#2cafdd]/5 hover:bg-[#2cafdd]/5 transition-colors relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-[#2cafdd]/10 text-[#2cafdd]">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium bg-muted/50 px-2 py-1 rounded-full">
                <Activity className="w-3 h-3" />
                Active: {performance.activeTickets}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Assigned</p>
              <h3 className="text-3xl font-bold tracking-tight">{performance.ticketsAssigned}</h3>
            </div>
            <div className="h-[40px] mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkline data={assignedTrend} color={COLORS.primary} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI 3: Satisfaction */}
      <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-3">
        <Card className="h-full border-none bg-gradient-to-br from-amber-500/10 to-transparent dark:from-amber-500/5 hover:bg-amber-500/5 transition-colors relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Star className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                Top 5%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
              <h3 className="text-3xl font-bold tracking-tight">
                {performance.satisfactionScore > 0 ? performance.satisfactionScore.toFixed(1) : '—'}
              </h3>
            </div>
            <div className="h-[40px] mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkline data={satisfactionTrend} color={COLORS.amber} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI 4: Speed */}
      <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-3">
        <Card className="h-full border-none bg-gradient-to-br from-purple-500/10 to-transparent dark:from-purple-500/5 hover:bg-purple-500/5 transition-colors relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" />
                -5% vs avg
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
              <h3 className="text-3xl font-bold tracking-tight">{performance.avgResponseTimeHours}h</h3>
            </div>
            <div className="h-[40px] mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkline data={responseTimeTrend} color={COLORS.purple} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 
        ROW 2: Main Velocity Chart (8 cols) + Skills Radar (4 cols)
      */}
      
      <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-8 h-[400px]">
        <Card className="h-full border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Ticket Velocity</CardTitle>
            <CardDescription>Assigned vs Resolved tickets over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="assigned" 
                  stroke={COLORS.primary} 
                  fillOpacity={1} 
                  fill="url(#colorAssigned)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke={COLORS.emerald} 
                  fillOpacity={1} 
                  fill="url(#colorResolved)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-4 h-[400px]">
        <Card className="h-full border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Skills Profile</CardTitle>
            <CardDescription>Performance metrics shape</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                <PolarGrid strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="My Performance"
                  dataKey="A"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
            {/* Center Icon/Score */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Zap className="w-6 h-6 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 
        ROW 3: Activity Heatmap (Full Width)
      */}
      <motion.div variants={itemVariants} className="col-span-12">
        <Card className="border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-muted rounded-xl">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Activity History</h3>
                <p className="text-sm text-muted-foreground">Daily resolution volume (Last 14 days)</p>
              </div>
            </div>
            
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="resolved" radius={[4, 4, 4, 4]} barSize={40}>
                    {activityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.resolved > 5 ? COLORS.emerald : entry.resolved > 2 ? COLORS.primary : COLORS.secondary}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  )
}
