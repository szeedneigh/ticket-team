/**
 * Supabase Auth Middleware
 * 
 * This middleware refreshes the user's session automatically.
 * Place this in your Next.js middleware.ts file at the root.
 * 
 * @example middleware.ts
 * ```ts
 * import { updateSession } from '@/lib/supabase/middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 * 
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { clientEnv } from '@/lib/env/client'
import { shouldClearSupabaseSession } from '@/lib/auth/supabase-session-errors'

/**
 * Redirect while preserving Set-Cookie from the Supabase client (e.g. after signOut).
 * Without this, cleared session cookies never reach the browser.
 */
function redirectPreservingSupabaseCookies(
  targetUrl: URL,
  supabaseResponse: NextResponse
) {
  const res = NextResponse.redirect(targetUrl)
  supabaseResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      res.headers.append(key, value)
    }
  })
  return res
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    clientEnv.supabase.url,
    clientEnv.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  let sessionUser = user

  // Stale or revoked refresh token: clear cookies so the client stops retrying
  if (authError && shouldClearSupabaseSession(authError)) {
    await supabase.auth.signOut()
    sessionUser = null
  }

  // Protected routes - redirect to sign-in if not authenticated
  const protectedRoutes = [
    '/dashboard',
    '/tickets',
    '/admin',
    '/kb',
    '/chat',
    '/analytics',
    '/profile',
    '/notifications',
    '/onboarding',
  ]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !sessionUser) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return redirectPreservingSupabaseCookies(url, supabaseResponse)
  }

  // Onboarding check: If user is authenticated but doesn't have a department,
  // redirect to onboarding (unless already on onboarding page or auth pages)
  if (
    sessionUser &&
    !request.nextUrl.pathname.startsWith('/onboarding') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const { data: userData } = await supabase
      .from('users')
      .select('department')
      .eq('id', sessionUser.id)
      .single()

    // If user doesn't have a department and trying to access protected routes
    if (!userData?.department && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/department'
      return redirectPreservingSupabaseCookies(url, supabaseResponse)
    }
  }

  // Role-based protection for admin routes
  if (sessionUser && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, deactivated_at')
      .eq('id', sessionUser.id)
      .single()
    
    // Check if user is deactivated
    if (userData?.deactivated_at) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/sign-in'
      url.searchParams.set('error', 'account_deactivated')
      return redirectPreservingSupabaseCookies(url, supabaseResponse)
    }
    
    // Check if user has admin or super_admin role
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'insufficient_permissions')
      return redirectPreservingSupabaseCookies(url, supabaseResponse)
    }
  }

  // Redirect authenticated users away from auth pages
  if (sessionUser && request.nextUrl.pathname.startsWith('/auth/sign-in')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return redirectPreservingSupabaseCookies(url, supabaseResponse)
  }
  
  return supabaseResponse
}

