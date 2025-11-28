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

export async function updateSession(request: NextRequest) {
  // E2E Test Bypass Mode - ONLY FOR DEVELOPMENT/TEST ENVIRONMENTS
  // SECURITY: Reject all bypass attempts in production
  if (process.env.NODE_ENV === 'production') {
    const bypassHeader = request.headers.get('x-e2e-test-auth')
    if (bypassHeader) {
      // Log security violation attempt
      console.error('[SECURITY] E2E bypass attempt in production rejected')
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
  }

  // Only allow E2E bypass in development/test with secret token
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const bypassHeader = request.headers.get('x-e2e-test-auth')
    const bypassSecret = process.env.E2E_BYPASS_SECRET

    if (bypassHeader && bypassHeader === bypassSecret) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[E2E Test Mode] Auth bypass enabled')
      }
      return NextResponse.next({ request })
    }
  }

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
  } = await supabase.auth.getUser()

  // Protected routes - redirect to sign-in if not authenticated
  const protectedRoutes = ['/dashboard', '/tickets', '/admin', '/kb/new']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Role-based protection for admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, deactivated_at')
      .eq('id', user.id)
      .single()
    
    // Check if user is deactivated
    if (userData?.deactivated_at) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/sign-in'
      url.searchParams.set('error', 'account_deactivated')
      return NextResponse.redirect(url)
    }
    
    // Check if user has admin or super_admin role
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'insufficient_permissions')
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth/sign-in')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  return supabaseResponse
}

