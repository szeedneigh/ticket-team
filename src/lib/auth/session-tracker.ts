/**
 * Session Tracking Utilities
 * Tracks user sessions for security monitoring
 */

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'

interface _SessionInfo {
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
 * @param userId - The user ID to track
 * @param sessionId - The session ID to track
 * @param supabase - Optional authenticated Supabase client (recommended for OAuth callbacks)
 */
export async function trackNewSession(
  userId: string,
  sessionId: string,
  supabase?: Awaited<ReturnType<typeof createClient>>
) {
  try {
    // Use provided client (from OAuth callback) or create new one
    const client = supabase || await createClient()
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const ip = await getClientIP()

    const deviceInfo = parseUserAgent(userAgent)

    // Use SECURITY DEFINER function to track session (bypasses RLS for new users)
    const { error } = await client.rpc('track_user_session', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_device_type: deviceInfo.device_type,
      p_browser: deviceInfo.browser,
      p_os: deviceInfo.os,
      p_device_name: deviceInfo.device_name,
      p_user_agent: userAgent,
      p_ip_address: ip
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
 * @param sessionId - The session ID to update
 * @param supabase - Optional authenticated Supabase client
 */
export async function updateSessionActivity(
  sessionId: string,
  supabase?: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const client = supabase || await createClient()

    await client
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
 * @param sessionId - The session ID to end
 * @param supabase - Optional authenticated Supabase client
 */
export async function endSession(
  sessionId: string,
  supabase?: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const client = supabase || await createClient()

    await client
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
 * @param email - User email
 * @param status - Login status (success/failed/blocked)
 * @param userId - Optional user ID
 * @param sessionId - Optional session ID
 * @param failureReason - Optional failure reason
 * @param supabase - Optional authenticated Supabase client
 */
export async function logLoginAttempt(
  email: string,
  status: 'success' | 'failed' | 'blocked',
  userId?: string,
  sessionId?: string,
  failureReason?: string,
  supabase?: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const client = supabase || await createClient()
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const ip = await getClientIP()

    const deviceInfo = parseUserAgent(userAgent)

    await client
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
