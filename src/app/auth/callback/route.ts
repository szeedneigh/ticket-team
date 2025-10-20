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
        // Sign out user if not from allowed domain
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/auth/error?error=invalid_domain`
        )
      }
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error('Failed to update last login:', updateError)
          }
        })
      
      // Success - redirect to dashboard or requested page
      const redirectUrl = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
    
    // Auth error
    console.error('Auth exchange error:', error)
  }
  
  // Return to sign-in with error
  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed`)
}

