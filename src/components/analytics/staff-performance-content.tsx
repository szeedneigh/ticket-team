/**
 * Staff Performance Content Component (Client)
 *
 * Premium staff analytics with glassmorphism styling,
 * modern leaderboard design, and semantic colors.
 */

'use client'

import { motion } from 'framer-motion'
import {
  KPICard,
  KPICardGrid,
  DataTable,
  BarChart,
  ExportButton,
} from '@/components/analytics'
import type { DataTableColumn } from '@/components/analytics'
import { UsersIcon, CheckCircleIcon, ClockIcon, TrophyIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { exportStaffPerformance } from '@/lib/analytics/export'
import type { ExportFormat } from '@/lib/types/analytics'

interface StaffMember {
  userName: string
  email: string
  ticketsResolved: number
  ticketsAssigned: number
  activeTickets: number
  overdueTickets: number
  avgResolutionTime: string
  satisfactionScore?: number // Optional - not shown to staff
}

interface StaffPerformanceContentProps {
  summary: {
    avgResponseTime: string
  }
  staffPerformance: StaffMember[]
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

// Medal colors for leaderboard
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] // Gold, Silver, Bronze

export function StaffPerformanceContent({
  summary,
  staffPerformance,
}: StaffPerformanceContentProps) {
  // Calculate team metrics
  const totalStaffMembers = staffPerformance.length
  const totalTicketsResolved = staffPerformance.reduce(
    (sum, s) => sum + s.ticketsResolved,
    0
  )
  const avgTicketsPerStaff =
    totalStaffMembers > 0 ? Math.round(totalTicketsResolved / totalStaffMembers) : 0

  const handleExport = async (format: ExportFormat) => {
    exportStaffPerformance(format, {
      staff: staffPerformance.map(s => ({
        userId: '',
        userName: s.userName,
        email: s.email,
        ticketsResolved: s.ticketsResolved,
        ticketsAssigned: s.ticketsAssigned,
        avgResolutionTime: s.avgResolutionTime,
        avgResolutionTimeHours: 0,
        avgResponseTime: '-',
        avgResponseTimeHours: 0,
        satisfactionScore: s.satisfactionScore ?? 0,
        activeTickets: s.activeTickets,
        overdueTickets: s.overdueTickets,
        dailyMetrics: [],
      })),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    })
  }

  // Define table columns with render functions
  const columns: DataTableColumn[] = [
    {
      key: 'userName',
      label: 'Staff Member',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium">{value as string}</p>
          <p className="text-xs text-muted-foreground">{row.email as string}</p>
        </div>
      ),
    },
    {
      key: 'ticketsResolved',
      label: 'Resolved',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {value as number}
        </Badge>
      ),
    },
    {
      key: 'ticketsAssigned',
      label: 'Assigned',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge variant="outline">{value as number}</Badge>
      ),
    },
    {
      key: 'activeTickets',
      label: 'Active',
      sortable: true,
      align: 'center',
      render: (value) => {
        const num = value as number
        return (
          <Badge variant={num > 0 ? 'default' : 'secondary'} className={num > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}>
            {num}
          </Badge>
        )
      },
    },
    {
      key: 'overdueTickets',
      label: 'Overdue',
      sortable: true,
      align: 'center',
      render: (value) => {
        const num = value as number
        return (
          <Badge variant={num > 0 ? 'destructive' : 'secondary'} className={num > 0 ? '' : 'bg-slate-100 text-slate-500'}>
            {num}
          </Badge>
        )
      },
    },
    {
      key: 'avgResolutionTime',
      label: 'Avg Resolution',
      sortable: false,
      align: 'right',
    },
  ]

  // Top performers for leaderboard
  const topPerformers = [...staffPerformance]
    .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
    .slice(0, 3)

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
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <UsersIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Performance</h1>
            <p className="text-muted-foreground">
              Team productivity and workload distribution
            </p>
          </div>
        </div>
        <ExportButton onExport={handleExport} />
      </motion.div>

      {/* Team Metrics */}
      <motion.div variants={itemVariants}>
        <KPICardGrid>
          <KPICard
            title="Total Staff"
            value={totalStaffMembers.toLocaleString()}
            description="Active support staff"
            icon={<UsersIcon className="h-4 w-4" />}
          />
          <KPICard
            title="Tickets Resolved"
            value={totalTicketsResolved.toLocaleString()}
            description="Last 30 days"
            icon={<CheckCircleIcon className="h-4 w-4" />}
            variant="success"
          />
          <KPICard
            title="Avg per Staff"
            value={avgTicketsPerStaff.toLocaleString()}
            description="Tickets resolved per person"
            icon={<CheckCircleIcon className="h-4 w-4" />}
          />
          <KPICard
            title="Team Avg Response"
            value={summary.avgResponseTime}
            description="Time to first response"
            icon={<ClockIcon className="h-4 w-4" />}
            variant="info"
          />
        </KPICardGrid>
      </motion.div>

      {/* Top Performers Showcase */}
      {topPerformers.length > 0 && (
        <motion.div className="space-y-4" variants={itemVariants}>
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Top Performers</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {topPerformers.map((staff, index) => (
              <div
                key={staff.email}
                className="group relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Rank badge */}
                <div 
                  className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-lg"
                  style={{ backgroundColor: MEDAL_COLORS[index] }}
                >
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-base font-bold">
                    {staff.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{staff.userName}</p>
                    <p className="text-xs text-muted-foreground">{staff.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-emerald-600">{staff.ticketsResolved}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assigned</p>
                    <p className="text-2xl font-bold text-blue-600">{staff.ticketsAssigned}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        <BarChart
          title="Resolution Leaderboard"
          description="Top performers by tickets resolved"
          data={staffPerformance.slice(0, 10).map((s) => ({
            name: s.userName,
            value: s.ticketsResolved,
          }))}
          dataKey="value"
          nameKey="name"
          orientation="horizontal"
          height={400}
          color="#10b981"
        />
        <BarChart
          title="Workload Distribution"
          description="Active tickets per staff member"
          data={staffPerformance.map((s) => ({
            name: s.userName.split(' ')[0],
            value: s.activeTickets,
          }))}
          dataKey="value"
          nameKey="name"
          height={400}
          color="#8b5cf6"
        />
      </motion.div>

      {/* Staff Performance Table */}
      <motion.div variants={itemVariants}>
        <DataTable
          title="Detailed Performance Metrics"
          description="Complete breakdown of staff performance"
          columns={columns}
          data={staffPerformance as unknown as Array<Record<string, unknown>>}
          showPagination={true}
          pageSize={10}
        />
      </motion.div>
    </motion.div>
  )
}
