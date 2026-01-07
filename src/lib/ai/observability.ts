/**
 * AI Observability Utilities
 * 
 * Functions for monitoring AI system performance:
 * - Model usage stats
 * - Automation metrics
 * - Prompt logs
 * - Event statistics
 * 
 * SERVER-ONLY
 */

'use server'

import { createServiceClient } from '@/lib/supabase/service'

export interface ModelUsageStats {
  model: string
  total_requests: number
  avg_latency_ms: number
  total_tokens: number
  avg_tokens: number
  error_rate: number
}

export async function getModelUsageStats(days: number = 30): Promise<ModelUsageStats[]> {
  try {
    const supabase = createServiceClient()
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase.rpc('get_ai_model_usage_stats', {
      p_start_date: startDate.toISOString(),
      p_end_date: new Date().toISOString(),
    })

    if (error) {
      console.error('[getModelUsageStats] Error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[getModelUsageStats] Exception:', error)
    return []
  }
}

export interface AutomationMetrics {
  automation_type: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  avg_duration_ms: number
  avg_confidence: number
  success_rate: number
}

export async function getAutomationMetrics(days: number = 30): Promise<AutomationMetrics[]> {
  try {
    const supabase = createServiceClient()
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase.rpc('get_automation_metrics', {
      p_automation_type: null,
      p_start_date: startDate.toISOString(),
      p_end_date: new Date().toISOString(),
    })

    if (error) {
      console.error('[getAutomationMetrics] Error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[getAutomationMetrics] Exception:', error)
    return []
  }
}

export async function getRecentPromptLogs(limit: number = 50) {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_prompt_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getRecentPromptLogs] Error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[getRecentPromptLogs] Exception:', error)
    return []
  }
}

export interface EventStats {
  event_type: string
  count: number
  percentage: number
}

export async function getEventStats(days: number = 30): Promise<EventStats[]> {
  try {
    const supabase = createServiceClient()
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('ai_events')
      .select('event_type')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('[getEventStats] Error:', error)
      return []
    }

    const counts: Record<string, number> = {}
    let total = 0

    for (const event of data || []) {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1
      total++
    }

    return Object.entries(counts).map(([event_type, count]) => ({
      event_type,
      count,
      percentage: (count / total) * 100,
    }))
  } catch (error) {
    console.error('[getEventStats] Exception:', error)
    return []
  }
}

export async function getObservabilityDashboardData(days: number = 30) {
  try {
    const [modelStats, automationMetrics, eventStats, promptLogs] = await Promise.all([
      getModelUsageStats(days),
      getAutomationMetrics(days),
      getEventStats(days),
      getRecentPromptLogs(20),
    ])

    return {
      modelStats,
      automationMetrics,
      eventStats,
      promptLogs,
    }
  } catch (error) {
    console.error('[getObservabilityDashboardData] Exception:', error)
    return {
      modelStats: [],
      automationMetrics: [],
      eventStats: [],
      promptLogs: [],
    }
  }
}










