/**
 * Dashboard Chart Queries
 * 
 * Server-side functions for fetching chart data for the dashboard.
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { ChartDataPoint } from '@/lib/types/dashboard'
import { PRIORITY_COLORS } from '@/lib/constants/colors'

/**
 * Get ticket volume trend (last 7 days)
 */
export async function getTicketVolumeTrend(userId: string, isStaff: boolean): Promise<ChartDataPoint[]> {
    const supabase = await createClient()
    const days = 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    try {
        let query = supabase
            .from('tickets')
            .select('created_at')
            .gte('created_at', startDate.toISOString())

        if (!isStaff) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            logger.error('Error fetching ticket volume trend', { error: error.message })
            return []
        }

        // Initialize map with all dates
        const volumeMap = new Map<string, number>()
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate)
            d.setDate(d.getDate() + i)
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            volumeMap.set(dateStr, 0)
        }

        // Aggregate counts
        data?.forEach(ticket => {
            const dateStr = new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (volumeMap.has(dateStr)) {
                volumeMap.set(dateStr, (volumeMap.get(dateStr) || 0) + 1)
            }
        })

        return Array.from(volumeMap.entries()).map(([name, value]) => ({ name, value }))
    } catch (error) {
        logger.error('Error fetching ticket volume trend', { error: error instanceof Error ? error.message : 'Unknown error' })
        return []
    }
}

/**
 * Get tickets by priority (Open/In Progress only)
 */
export async function getTicketsByPriority(userId: string, isStaff: boolean): Promise<ChartDataPoint[]> {
    const supabase = await createClient()

    try {
        let query = supabase
            .from('tickets')
            .select('priority')
            .in('status', ['open', 'in_progress'])

        if (!isStaff) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            logger.error('Error fetching tickets by priority', { error: error.message })
            return []
        }

        const counts = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        }

        data?.forEach(ticket => {
            const p = ticket.priority as keyof typeof counts
            if (counts[p] !== undefined) {
                counts[p]++
            }
        })

        return [
            { name: 'Low', value: counts.low, color: PRIORITY_COLORS.low },
            { name: 'Medium', value: counts.medium, color: PRIORITY_COLORS.medium },
            { name: 'High', value: counts.high, color: PRIORITY_COLORS.high },
            { name: 'Critical', value: counts.critical, color: PRIORITY_COLORS.critical },
        ].filter(item => item.value > 0)

    } catch (error) {
        logger.error('Error fetching tickets by priority', { error: error instanceof Error ? error.message : 'Unknown error' })
        return []
    }
}

/**
 * Get tickets by status
 */
export async function getTicketsByStatus(userId: string, isStaff: boolean): Promise<ChartDataPoint[]> {
    const supabase = await createClient()

    try {
        let query = supabase
            .from('tickets')
            .select('status')

        if (!isStaff) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            logger.error('Error fetching tickets by status', { error: error.message })
            return []
        }

        const counts = {
            open: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0
        }

        data?.forEach(ticket => {
            const s = ticket.status as keyof typeof counts
            if (counts[s] !== undefined) {
                counts[s]++
            }
        })

        return [
            { name: 'Open', value: counts.open, color: '#3b82f6' },
            { name: 'In Progress', value: counts.in_progress, color: '#f59e0b' },
            { name: 'Resolved', value: counts.resolved, color: '#10b981' },
            { name: 'Closed', value: counts.closed, color: '#6b7280' },
        ].filter(item => item.value > 0)

    } catch (error) {
        logger.error('Error fetching tickets by status', { error: error instanceof Error ? error.message : 'Unknown error' })
        return []
    }
}
