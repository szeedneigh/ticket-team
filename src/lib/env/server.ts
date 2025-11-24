/**
 * Server-Only Environment Variables
 *
 * This module contains environment variables that must NEVER be exposed
 * to the client. These include API keys, service role keys, and other secrets.
 *
 * CRITICAL SECURITY: This file should ONLY be imported by:
 * - Server Components (async functions in app/)
 * - Server Actions (files with 'use server')
 * - API Routes (app/api/*)
 * - Middleware (middleware.ts)
 *
 * NEVER import this file in:
 * - Client Components (files with 'use client')
 * - Client-side hooks (use-*.ts files that run in browser)
 * - Any file that might be bundled for the browser
 *
 * @module lib/env/server
 */

/**
 * Runtime check to prevent client-side access
 * This will throw an error if server env is accessed in the browser
 */
if (typeof window !== 'undefined') {
  throw new Error(
    'CRITICAL SECURITY ERROR: Server environment variables cannot be accessed in client-side code.\n' +
    'You are trying to import @/lib/env/server in a client component.\n\n' +
    'For client-safe variables, use: import { clientEnv } from "@/lib/env/client"\n' +
    'This error prevents exposing sensitive secrets like SUPABASE_SERVICE_ROLE_KEY to the browser.'
  )
}

/**
 * Get a server-only environment variable with validation
 */
function getServerEnvVar(
  key: string,
  options: { required?: boolean; defaultValue?: string } = {}
): string {
  const { required = true, defaultValue } = options

  const value = process.env[key]

  if (value) {
    return value
  }

  if (!required) {
    return defaultValue || ''
  }

  // In development, provide helpful error message
  if (process.env.NODE_ENV === 'development') {
    console.error(
      `❌ CRITICAL: Missing required environment variable: ${key}\n\n` +
      `This will cause the application to malfunction!\n\n` +
      `Steps to fix:\n` +
      `1. Check that .env.local exists in project root\n` +
      `2. Verify ${key} is set in .env.local\n` +
      `3. Restart the dev server: npm run dev\n\n` +
      `See docs/01-overview/setup-guide.md for detailed instructions.`
    )

    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please check .env.local and restart the dev server.`
    )
  }

  // In production, throw error
  throw new Error(
    `Missing required environment variable: ${key}\n` +
    `See docs/01-overview/setup-guide.md for setup instructions.`
  )
}

/**
 * Server-only environment configuration
 * Contains sensitive secrets that must NEVER be exposed to the client
 */
export const serverEnv = {
  /**
   * Supabase service role configuration
   * BYPASSES ALL ROW LEVEL SECURITY - Use with extreme caution
   */
  supabaseService: {
    roleKey: getServerEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },

  /**
   * Gemini API configuration
   */
  gemini: {
    apiKey: getServerEnvVar('GEMINI_API_KEY', { required: false }),
  },

  /**
   * Resend email service configuration
   */
  resend: {
    apiKey: getServerEnvVar('RESEND_API_KEY', { required: false }),
  },

  /**
   * Allowed OAuth redirect origins (server-side validation)
   */
  allowedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ].filter(Boolean),
} as const

/**
 * Validate request origin against allowed origins
 *
 * @param origin - Request origin URL
 * @returns Whether origin is allowed
 */
export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false

  try {
    const originUrl = new URL(origin)
    return serverEnv.allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed)
        return (
          originUrl.protocol === allowedUrl.protocol &&
          originUrl.hostname === allowedUrl.hostname &&
          originUrl.port === allowedUrl.port
        )
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}
