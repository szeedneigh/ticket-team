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
import { clientEnv } from '@/lib/env/client'

// Force dynamic rendering for OAuth callback
// This route cannot be statically exported as it processes authentication codes
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:26',message:'OAuth callback started',data:{hasCode:!!code,origin,next},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (code) {
    const supabase = await createClient()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:32',message:'Before exchangeCodeForSession',data:{code:code.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:36',message:'After exchangeCodeForSession',data:{hasData:!!data,hasError:!!error,errorMsg:error?.message,userEmail:data?.user?.email,userId:data?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion

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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:68',message:'Before update last login',data:{userId:data.user.id,email:data.user.email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion

      // Check if this is a new user (first login) and if onboarding is needed
      const { data: userData } = await supabase
        .from('users')
        .select('last_login, full_name, role, department')
        .eq('id', data.user.id)
        .single()

      const isNewUser = !userData?.last_login
      const needsOnboarding = !userData?.department

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:77',message:'After update last login',data:{hasUpdateError:!!updateError,updateErrorMsg:updateError?.message,updateErrorCode:updateError?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4,H5'})}).catch(()=>{});
      // #endregion

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:79',message:'Before trackNewSession',data:{userId:data.user.id,sessionId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3'})}).catch(()=>{});
      // #endregion
      await trackNewSession(data.user.id, sessionId, supabase)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3464a267-808d-4502-a9a0-ad5cbc96dbd9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:84',message:'After trackNewSession',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3'})}).catch(()=>{});
      // #endregion

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

