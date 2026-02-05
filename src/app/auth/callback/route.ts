/**
 * OAuth Callback Route
 * 
 * Handles the OAuth callback from Google.
 * Exchanges the authorization code for a session and validates the user's email domain.
 * 
 * @module app/auth/callback/route
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { trackNewSession, logLoginAttempt } from '@/lib/auth/session-tracker'
import { sendWelcomeEmail } from '@/lib/email/service'

// Force dynamic rendering for OAuth callback
// This route cannot be statically exported as it processes authentication codes
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && data.session) {
      // Validate email domain
      const email = data.user.email
      const allowedDomains = ['laverdad.edu.ph', 'student.laverdad.edu.ph']
      const domain = email?.split('@')[1]

      if (!domain || !allowedDomains.includes(domain)) {
        const userId = data.user.id

        // Log failed login attempt
        await logLoginAttempt(
          email || 'unknown',
          'blocked',
          userId,
          undefined,
          'invalid_domain',
          supabase
        )

        // Clean up: Delete from public.users first (due to FK constraint)
        // This prevents invalid domain users from having profiles
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) {
          logger.error('Failed to clean up invalid domain user', { userId, error: deleteError.message })
        }

        // Sign out the user session
        await supabase.auth.signOut()

        return NextResponse.redirect(
          `${origin}/auth/error?error=invalid_domain`
        )
      }

      // Check if this is a new user (first login) and if onboarding is needed
      // Use maybeSingle() to avoid 406 when trigger hasn't created the row yet (race condition)
      let { data: userData } = await supabase
        .from('users')
        .select('last_login, full_name, role, department')
        .eq('id', data.user.id)
        .maybeSingle()

      // Fallback: Create user row if trigger didn't run (handles OAuth race condition)
      if (!userData) {
        const { error: insertError } = await supabase.from('users').upsert(
          {
            id: data.user.id,
            email: email || '',
            full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? email?.split('@')[0] ?? 'User',
            role: 'employee',
          },
          { onConflict: 'id' }
        )
        if (insertError) {
          logger.error('Failed to create user profile fallback', { userId: data.user.id, error: insertError.message })
        } else {
          const { data: created } = await supabase
            .from('users')
            .select('last_login, full_name, role, department')
            .eq('id', data.user.id)
            .maybeSingle()
          userData = created ?? null
        }
      }

      const isNewUser = !userData?.last_login
      const needsOnboarding = !userData?.department

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)

      if (updateError) {
        logger.error('Failed to update last login', { userId: data.user.id, error: updateError.message })
      }

      // Send welcome email to new users (non-blocking)
      if (isNewUser && email && userData) {
        sendWelcomeEmail({
          to: email,
          userName: userData.full_name || email.split('@')[0] || 'User',
          userEmail: email,
          role: userData.role || 'employee',
          dashboardUrl: `${origin}/dashboard`,
        }).catch((emailError) => {
          // Log error but don't block login
          logger.error('Failed to send welcome email', {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            userId: data.user.id,
            email,
          })
        })
      }

      // Track the new session (use session ID, not access token for security)
      const sessionId = data.session.user?.id || data.user.id
      await trackNewSession(data.user.id, sessionId, supabase)

      // Log successful login (don't log access token)
      await logLoginAttempt(
        email || 'unknown',
        'success',
        data.user.id,
        sessionId,
        undefined,
        supabase
      )

      // Redirect based on onboarding status
      if (needsOnboarding) {
        return NextResponse.redirect(`${origin}/onboarding/department`)
      }

      // Redirect employees to chat, others to dashboard
      const userRole = userData?.role || 'employee'
      const isEmployee = userRole === 'employee'
      
      // Success - redirect based on role or requested page
      let redirectUrl = next.startsWith('/') ? next : (isEmployee ? '/chat' : '/dashboard')
      
      // If next is explicitly set and not dashboard, use it
      // Otherwise, use role-based default
      if (next === '/dashboard' && isEmployee) {
        redirectUrl = '/chat'
      }
      
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }

    // Auth error - log failed attempt
    if (error) {
      const authUser = (data as { user?: { email?: string; id?: string } | null })?.user
      if (authUser?.email) {
        await logLoginAttempt(
          authUser.email,
          'failed',
          authUser.id,
          undefined,
          'auth_exchange_failed',
          supabase
        )
      }
    }

    logger.error('Auth exchange error', { error: error?.message })
  }

  // Return to sign-in with error
  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed`)
}

