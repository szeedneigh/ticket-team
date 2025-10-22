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
  const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL
  
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
    console.error('Google sign-in error:', error)
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
    console.error('Failed to update last login:', error)
    return { error: error.message }
  }
  
  return { success: true }
}

/**
 * Update user profile
 * @param formData - Form data containing profile updates
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return { error: 'Not authenticated' }
  }
  
  const updates = {
    full_name: formData.get('fullName') as string,
    department: formData.get('department') as string || null,
    position: formData.get('position') as string || null,
    phone: formData.get('phone') as string || null,
    updated_at: new Date().toISOString(),
  }
  
  // Validate required fields
  if (!updates.full_name || updates.full_name.trim().length < 2) {
    return { error: 'Full name must be at least 2 characters' }
  }
  
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', authUser.id)
  
  if (error) {
    console.error('Profile update error:', error)
    return { error: error.message }
  }
  
  return { success: true, message: 'Profile updated successfully' }
}

/**
 * Update user avatar URL
 * @param avatarUrl - The new avatar URL
 */
export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('users')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUser.id)
  
  if (error) {
    console.error('Avatar update error:', error)
    return { error: error.message }
  }
  
  return { success: true, message: 'Avatar updated successfully' }
}

/**
 * Check if the current user is authenticated
 * @returns Whether the user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session !== null
}

