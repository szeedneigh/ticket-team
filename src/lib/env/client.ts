/**
 * Client-Safe Environment Variables
 *
 * This module contains ONLY environment variables that are safe to expose
 * to the browser. All variables here must be prefixed with NEXT_PUBLIC_.
 *
 * IMPORTANT: This file can be imported by client components.
 * NEVER add server-only secrets to this file.
 *
 * @module lib/env/client
 */

/**
 * Get a NEXT_PUBLIC_ environment variable with validation
 *
 * This uses static access to ensure Next.js webpack can properly
 * inject the values into the client bundle at build time.
 */
function getPublicEnvVar(
  key: string,
  options: { required?: boolean; defaultValue?: string } = {}
): string {
  const { required = true, defaultValue } = options

  // Static access map for all NEXT_PUBLIC_* variables
  // This is required for Next.js webpack to properly inject them
  let value: string | undefined

  if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
    value = process.env.NEXT_PUBLIC_SUPABASE_URL
  } else if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } else if (key === 'NEXT_PUBLIC_SITE_URL') {
    value = process.env.NEXT_PUBLIC_SITE_URL
  }

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
      `3. Restart the dev server: npm run dev\n` +
      `4. Clear browser cache (Ctrl+Shift+R)\n\n` +
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
 * Client-safe environment configuration
 * Only contains NEXT_PUBLIC_* variables that are safe to expose to the browser
 */
export const clientEnv = {
  /**
   * Supabase public configuration (safe for client-side)
   */
  supabase: {
    url: getPublicEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getPublicEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },

  /**
   * Application configuration
   */
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
} as const

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return clientEnv.app.nodeEnv === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return clientEnv.app.nodeEnv === 'development'
}
