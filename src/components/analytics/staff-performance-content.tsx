/**
 * Staff Performance Content Component (Client)
 *
 * Contains interactive data table with custom render functions.
 * Extracted as a client component to avoid passing functions from server to client.
 */

'use client'

import {
  KPICard,
  KPICardGrid,
  DataTable,
  BarChart,
  ExportButton,
} from '@/components/analytics'
import type { DataTableColumn } from '@/components/analytics'
import { UsersIcon, CheckCircleIcon, ClockIcon } from 'lucide-react'
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
  satisfactionScore: number
}

interface StaffPerformanceContentProps {
  summary: {
    avgResponseTime: string
  }
  staffPerformance: StaffMember[]
}

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
        satisfactionScore: s.satisfactionScore,
        activeTickets: s.activeTickets,
        overdueTickets: s.overdueTickets,
      })),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    })
  }

  // Define table columns with render functions (must be in client component)
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
        <Badge variant="secondary">{value as number}</Badge>
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
        return <Badge variant={num > 0 ? 'default' : 'secondary'}>{num}</Badge>
      },
    },
    {
      key: 'overdueTickets',
      label: 'Overdue',
      sortable: true,
      align: 'center',
      render: (value) => {
        const num = value as number
        return <Badge variant={num > 0 ? 'destructive' : 'secondary'}>{num}</Badge>
      },
    },
    {
      key: 'avgResolutionTime',
      label: 'Avg Resolution',
      sortable: false,
      align: 'right',
    },
    {
      key: 'satisfactionScore',
      label: 'Satisfaction',
      sortable: true,
      align: 'right',
      render: (value) => {
        const score = value as number
        return (
          <span className="font-medium">
            {score > 0 ? `${score.toFixed(1)}/5.0` : '-'}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Performance</h1>
          <p className="text-muted-foreground">
            Team productivity and workload distribution
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Team Metrics */}
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

      {/* Leaderboard Chart */}
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
        color="hsl(var(--primary))"
      />

      {/* Workload Distribution */}
      <BarChart
        title="Workload Distribution"
        description="Active tickets per staff member"
        data={staffPerformance.map((s) => ({
          name: s.userName.split(' ')[0], // First name only
          value: s.activeTickets,
        }))}
        dataKey="value"
        nameKey="name"
        height={300}
        color="hsl(var(--chart-2))"
      />

      {/* Staff Performance Table */}
      <DataTable
        title="Detailed Performance Metrics"
        description="Complete breakdown of staff performance"
        columns={columns}
        data={staffPerformance as unknown as Array<Record<string, unknown>>}
        showPagination={true}
        pageSize={10}
      />
    </div>
  )
}

