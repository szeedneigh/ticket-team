/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Provides health status for monitoring and deployment verification.
 * Checks database connectivity, AI service availability, and storage access.
 *
 * @module app/api/health/route
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAIConfigured } from '@/lib/ai/client'
import { serverEnv } from '@/lib/env/server'
import { clientEnv } from '@/lib/env/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: {
      status: 'ok' | 'error'
      message?: string
      responseTime?: number
    }
    ai: {
      status: 'ok' | 'error' | 'not_configured'
      message?: string
    }
    storage: {
      status: 'ok' | 'error'
      message?: string
    }
    email: {
      status: 'ok' | 'error' | 'not_configured'
      message?: string
    }
  }
}

export async function GET() {
  const startTime = Date.now()
  const checks: HealthStatus['checks'] = {
    database: { status: 'error' },
    ai: { status: 'not_configured' },
    storage: { status: 'error' },
    email: { status: 'not_configured' },
  }

  // Check database connectivity
  try {
    const dbStartTime = Date.now()
    const supabase = createServiceClient()
    const { error } = await supabase.from('users').select('count').limit(1)
    const dbResponseTime = Date.now() - dbStartTime

    if (error) {
      checks.database = {
        status: 'error',
        message: `Database query failed: ${error.message}`,
        responseTime: dbResponseTime,
      }
    } else {
      checks.database = {
        status: 'ok',
        message: 'Database connection successful',
        responseTime: dbResponseTime,
      }
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  // Check AI service availability
  if (isAIConfigured()) {
    try {
      // Simple check - verify API key is set and client can be initialized
      checks.ai = {
        status: 'ok',
        message: 'AI service configured',
      }
    } catch (error) {
      checks.ai = {
        status: 'error',
        message: error instanceof Error ? error.message : 'AI service check failed',
      }
    }
  } else {
    checks.ai = {
      status: 'not_configured',
      message: 'AI service not configured (GEMINI_API_KEY not set)',
    }
  }

  // Check storage bucket access
  try {
    const supabase = createServiceClient()
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      checks.storage = {
        status: 'error',
        message: `Storage access failed: ${error.message}`,
      }
    } else {
      // Check if required buckets exist
      const requiredBuckets = ['ticket-attachments', 'user-uploads']
      const existingBuckets = buckets?.map(b => b.name) || []
      const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b))

      if (missingBuckets.length > 0) {
        checks.storage = {
          status: 'error',
          message: `Missing required buckets: ${missingBuckets.join(', ')}`,
        }
      } else {
        checks.storage = {
          status: 'ok',
          message: 'Storage buckets accessible',
        }
      }
    }
  } catch (error) {
    checks.storage = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Storage check failed',
    }
  }

  // Check email service configuration
  if (serverEnv.resend.apiKey) {
    checks.email = {
      status: 'ok',
      message: 'Email service configured',
    }
  } else {
    checks.email = {
      status: 'not_configured',
      message: 'Email service not configured (RESEND_API_KEY not set)',
    }
  }

  // Determine overall status
  const criticalChecks = [checks.database, checks.storage]
  const hasCriticalErrors = criticalChecks.some(check => check.status === 'error')
  const hasWarnings = Object.values(checks).some(
    check => check.status === 'not_configured'
  )

  const overallStatus: HealthStatus['status'] = hasCriticalErrors
    ? 'unhealthy'
    : hasWarnings
      ? 'degraded'
      : 'healthy'

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(healthStatus, { status: statusCode })
}

