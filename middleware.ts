import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimitSlidingWindow } from '@/lib/security/rate-limit'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method.toUpperCase()

  // ---------------------------------------------------------------------------
  // Best-effort rate limiting (in-memory, per instance)
  // ---------------------------------------------------------------------------
  const ip =
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const isWriteMethod = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'

  const buckets: Array<{ match: boolean; key: string; limit: number; windowMs: number }> = [
    {
      // Client AI event ingestion (can be spammed)
      match: pathname === '/api/ai/events' && method === 'POST',
      key: `ip:${ip}:api:ai:events:post`,
      limit: 20,
      windowMs: 60_000,
    },
    {
      // AI embedding ingestion pipeline (expensive; admin-only but still protect)
      match: pathname === '/api/ai/ingest',
      key: `ip:${ip}:api:ai:ingest:any`,
      limit: 5,
      windowMs: 60_000,
    },
    {
      // Admin operations (especially mutations)
      match: pathname.startsWith('/api/admin/') && isWriteMethod,
      key: `ip:${ip}:api:admin:write`,
      limit: 5,
      windowMs: 60_000,
    },
    {
      // Versioned API writes (best-effort generic throttle)
      match: pathname.startsWith('/api/v1/') && isWriteMethod,
      key: `ip:${ip}:api:v1:write`,
      limit: 60,
      windowMs: 60_000,
    },
  ]

  const activeBucket = buckets.find((b) => b.match)
  if (activeBucket) {
    const result = rateLimitSlidingWindow({
      key: activeBucket.key,
      limit: activeBucket.limit,
      windowMs: activeBucket.windowMs,
    })

    if (!result.allowed) {
      const res = NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
      res.headers.set('Retry-After', String(result.retryAfterSeconds))
      res.headers.set('X-RateLimit-Limit', String(result.limit))
      res.headers.set('X-RateLimit-Remaining', String(result.remaining))
      return res
    }
  }

  // Handle authentication and session
  const response = await updateSession(request)

  // Add security headers
  const headers = response.headers

  // Prevent clickjacking attacks
  headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy - only send origin for cross-origin requests
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - restrict access to sensitive features
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Content Security Policy (CSP)
  // Note: This is a strict policy. Adjust as needed for your application.
  // In development, we relax the policy for Turbopack HMR and server actions
  const isDev = process.env.NODE_ENV === 'development'

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    // Allow connections to self (server actions), Supabase, Sentry, and localhost in dev
    isDev
      ? "connect-src 'self' http://localhost:* ws://localhost:* https://*.supabase.co https://*.sentry.io wss://*.supabase.co"
      : "connect-src 'self' https://*.supabase.co https://*.sentry.io wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  headers.set('Content-Security-Policy', cspHeader)

  // HSTS - Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

