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
    
    if (!error && data.user) {
      // Validate email domain
      const email = data.user.email
      const allowedDomains = ['laverdad.edu.ph', 'student.laverdad.edu.ph']
      const domain = email?.split('@')[1]
      
      if (!domain || !allowedDomains.includes(domain)) {
        const userId = data.user.id
        
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
      
      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)
      
      if (updateError) {
        logger.error('Failed to update last login', { userId: data.user.id, error: updateError.message })
      }
      
      // Success - redirect to dashboard or requested page
      const redirectUrl = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
    
    // Auth error
    logger.error('Auth exchange error', { error: error?.message })
  }
  
  // Return to sign-in with error
  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed`)
}

