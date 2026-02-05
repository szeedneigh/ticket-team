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

  // Onboarding check: If user is authenticated but doesn't have a department,
  // redirect to onboarding (unless already on onboarding page or auth pages)
  if (
    user &&
    !request.nextUrl.pathname.startsWith('/onboarding') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const { data: userData } = await supabase
      .from('users')
      .select('department')
      .eq('id', user.id)
      .single()

    // If user doesn't have a department and trying to access protected routes
    if (!userData?.department && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/department'
      return NextResponse.redirect(url)
    }
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

