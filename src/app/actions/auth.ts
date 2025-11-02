/**
 * Authentication Server Actions
 * 
 * Server actions for Google SSO authentication and user management.
 * All authentication mutations must go through these server actions.
 * 
 * @module app/actions/auth
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { clientEnv } from '@/lib/env/client'
import { isValidOrigin } from '@/lib/env/server'
import { logger } from '@/lib/logger'

interface ActionResult {
  success?: boolean
  error?: string
  message?: string
}

/**
 * Initiate Google OAuth sign-in
 * Redirects user to Google's consent screen
 */
export async function signInWithGoogle(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const origin = (await headers()).get('origin') || clientEnv.app.siteUrl
  
  // Validate origin if provided
  if (origin && !isValidOrigin(origin)) {
    return { error: 'Invalid request origin' }
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        // No domain hint - users can freely choose their email
        // Domain validation happens in the callback route
      },
    },
  })
  
  if (error) {
    logger.error('Google sign-in error', { error: error.message })
    return { error: error.message }
  }
  
  if (data.url) {
    return { url: data.url }
  }
  
  return { error: 'Failed to initiate Google sign-in' }
}

/**
 * Sign out the current user
 * Clears session and redirects to sign-in page
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/sign-in')
}

/**
 * Update last login timestamp
 * Called after successful authentication
 */
export async function updateLastLogin(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id)
  
  if (error) {
    logger.error('Failed to update last login', { error: error.message })
    return { error: error.message }
  }
  
  return { success: true }
}

/**
 * Check if the current user is authenticated
 * @returns Whether the user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user !== null
}

