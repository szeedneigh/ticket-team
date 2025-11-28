/**
 * Session Tracking Utilities
 * Tracks user sessions for security monitoring
 */

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'

interface SessionInfo {
  session_id: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  user_agent: string
  ip_address: string
  country?: string
  city?: string
}

/**
 * Parse user agent to get device info
 */
export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  let device_type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (result.device.type === 'mobile') device_type = 'mobile'
  else if (result.device.type === 'tablet') device_type = 'tablet'

  return {
    device_type,
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    device_name: result.device.model || result.device.vendor || 'Unknown Device'
  }
}

/**
 * Get client IP address from headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Check common IP headers
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') || // Cloudflare
    headersList.get('x-client-ip') ||
    '127.0.0.1'

  return ip
}

/**
 * Track new session on login
 */
export async function trackNewSession(userId: string, sessionId: string) {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const ip = await getClientIP()

    const deviceInfo = parseUserAgent(userAgent)

    // Insert session record
    const { error } = await supabase
      .from('user_sessions_log')
      .insert({
        user_id: userId,
        session_id: sessionId,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_name: deviceInfo.device_name,
        user_agent: userAgent,
        ip_address: ip,
        login_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        is_active: true
      })

    if (error) {
      console.error('Failed to track session:', error)
    }
  } catch (error) {
    console.error('Session tracking error:', error)
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string) {
  try {
    const supabase = await createClient()

    await supabase
      .from('user_sessions_log')
      .update({
        last_activity_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('is_active', true)
  } catch (error) {
    console.error('Session activity update error:', error)
  }
}

/**
 * Mark session as logged out
 */
export async function endSession(sessionId: string) {
  try {
    const supabase = await createClient()

    await supabase
      .from('user_sessions_log')
      .update({
        is_active: false,
        logout_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
  } catch (error) {
    console.error('Session end error:', error)
  }
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  email: string,
  status: 'success' | 'failed' | 'blocked',
  userId?: string,
  sessionId?: string,
  failureReason?: string
) {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const ip = await getClientIP()

    const deviceInfo = parseUserAgent(userAgent)

    await supabase
      .from('login_history')
      .insert({
        user_id: userId || null,
        email,
        status,
        failure_reason: failureReason,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        user_agent: userAgent,
        ip_address: ip,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.error('Login history logging error:', error)
  }
}
