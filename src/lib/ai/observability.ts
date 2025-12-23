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

// ============================================================================
// Model Usage Stats
// ============================================================================

export interface ModelUsageStats {
  model: string
  total_requests: number
  avg_latency_ms: number
  total_tokens: number
  avg_tokens: number
  error_rate: number
}

/**
 * Get AI model usage statistics
 * 
 * @param days - Number of days to look back
 * @returns Model usage stats
 */
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

// ============================================================================
// Automation Metrics
// ============================================================================

export interface AutomationMetrics {
  automation_type: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  avg_duration_ms: number
  avg_confidence: number
  success_rate: number
}

/**
 * Get automation performance metrics
 * 
 * @param days - Number of days to look back
 * @returns Automation metrics
 */
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

// ============================================================================
// Recent Prompt Logs
// ============================================================================

/**
 * Get recent prompt logs for monitoring
 * 
 * @param limit - Number of logs to return
 * @returns Recent prompt logs
 */
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

// ============================================================================
// Event Statistics
// ============================================================================

export interface EventStats {
  event_type: string
  count: number
  percentage: number
}

/**
 * Get event distribution statistics
 * 
 * @param days - Number of days to look back
 * @returns Event statistics
 */
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

    // Count by event type
    const counts: Record<string, number> = {}
    let total = 0

    for (const event of data || []) {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1
      total++
    }

    // Convert to array with percentages
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

// ============================================================================
// Dashboard Data
// ============================================================================

/**
 * Get all observability data for dashboard
 * 
 * @param days - Number of days to look back
 * @returns Complete dashboard data
 */
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



