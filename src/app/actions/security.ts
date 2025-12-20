/**
 * Security Server Actions - FULLY FUNCTIONAL
 *
 * Server actions for security management including password changes,
 * session management, and login history.
 *
 * @module app/actions/security
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import type { ActionResult } from '@/lib/types/api'

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Change user password
 *
 * @param formData - Form data containing password fields
 * @returns ActionResult indicating success or failure
 */
export async function changePassword(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Extract and validate form data
    const rawData = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const validatedData = passwordChangeSchema.parse(rawData)

    const supabase = await createClient()

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validatedData.currentPassword,
    })

    if (signInError) {
      logger.warn('Password verification failed', { userId: user.id })
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    })

    if (updateError) {
      logger.error('Password update error', { error: updateError.message, userId: user.id })
      return { success: false, error: 'Failed to update password' }
    }

    // Log password change in user record
    await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    logger.info('Password changed successfully', { userId: user.id })

    // Revalidate profile page
    revalidatePath('/profile')

    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Password change validation error', { errors: error.errors })
      return { success: false, error: error.errors[0].message }
    }

    logger.error('Password change error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's active sessions
 */
interface ActiveSession {
  id: string
  session_id: string
  user_id: string
  browser: string | null
  os: string | null
  device_type: 'desktop' | 'mobile' | 'tablet' | null
  city: string | null
  country: string | null
  ip_address: string
  last_activity_at: string
  is_active: boolean
  logout_at: string | null
  user_agent: string | null
  is_current?: boolean
}

/**
 * Get user's active sessions
 */
export async function getActiveSessions(): Promise<ActionResult<ActiveSession[]>> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supabase = await createClient()

    // Get current session
    const { data: { session: currentSession } } = await supabase.auth.getSession()

    // Fetch active sessions
    const { data: sessions, error } = await supabase
      .from('user_sessions_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('logout_at', null)
      .order('last_activity_at', { ascending: false })
      .limit(10)

    if (error) {
      logger.error('Error fetching sessions', { error: error.message })
      return { success: false, error: 'Failed to fetch sessions' }
    }

    // Mark current session
    const sessionsWithCurrent: ActiveSession[] = (sessions || []).map((session) => ({
      ...session,
      is_current: session.session_id === currentSession?.access_token
    })) || []

    return { success: true, data: sessionsWithCurrent }
  } catch (error) {
    logger.error('Get sessions error', { error })
    return { success: false, error: 'Failed to fetch sessions' }
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supabase = await createClient()

    // Call database function to revoke
    const { error } = await supabase.rpc('revoke_user_session', {
      p_session_id: sessionId,
      p_revoked_by: user.id,
      p_reason: 'User revoked via security settings'
    })

    if (error) {
      logger.error('Session revocation error', { error: error.message })
      return { success: false, error: 'Failed to revoke session' }
    }

    logger.info('Session revoked', { userId: user.id, sessionId })
    revalidatePath('/profile')
    return { success: true, message: 'Session revoked successfully' }
  } catch (error) {
    logger.error('Revoke session error', { error })
    return { success: false, error: 'Failed to revoke session' }
  }
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllSessions(): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: 'No active session' }
    }

    // Call database function
    const { data: count, error } = await supabase.rpc('revoke_all_other_sessions', {
      p_user_id: user.id,
      p_current_session_id: session.access_token,
      p_reason: 'User revoked all sessions via security settings'
    })

    if (error) {
      logger.error('Revoke all sessions error', { error: error.message })
      return { success: false, error: 'Failed to revoke sessions' }
    }

    logger.info('All sessions revoked', { userId: user.id, count })
    revalidatePath('/profile')
    return {
      success: true,
      message: `Revoked ${count || 0} session(s) successfully`
    }
  } catch (error) {
    logger.error('Revoke all sessions error', { error })
    return { success: false, error: 'Failed to revoke sessions' }
  }
}

/**
 * Get user's login history
 */
interface LoginHistoryRecord {
  id: string
  user_id: string
  timestamp: string
  device_type: string | null
  browser: string | null
  os: string | null
  ip_address: string
  city: string | null
  country: string | null
  status: 'success' | 'failed' | 'blocked'
  failure_reason?: string | null
}

export async function getLoginHistory(limit: number = 20): Promise<ActionResult<LoginHistoryRecord[]>> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supabase = await createClient()
    const { data: history, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching login history', { error: error.message })
      return { success: false, error: 'Failed to fetch login history' }
    }

    return { success: true, data: (history || []) as LoginHistoryRecord[] }
  } catch (error) {
    logger.error('Get login history error', { error })
    return { success: false, error: 'Failed to fetch login history' }
  }
}
