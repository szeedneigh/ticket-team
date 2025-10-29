/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at runtime (lazy-loaded).
 * Exports validated constants for type safety across the application.
 * 
 * @module lib/env
 */

/**
 * Cached validated environment configuration
 */
let validatedEnv: ReturnType<typeof createEnv> | null = null

function createEnv() {
  return {
    // Supabase Configuration (Client-side safe)
    supabase: {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    },
    
    // Supabase Service Role (Server-side only - NEVER expose to client)
    supabaseService: {
      roleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    },
    
    // Gemini API Configuration
    gemini: {
      apiKey: getEnvVar('GEMINI_API_KEY', { required: false }),
    },
    
    // Application Configuration
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    
    // Allowed OAuth redirect origins
    allowedOrigins: [
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'http://localhost:3000',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
    ].filter(Boolean),
  }
}

/**
 * Validated environment configuration (lazy-loaded via Proxy)
 * This prevents validation errors during module initialization in client components
 */
export const env = new Proxy({} as ReturnType<typeof createEnv>, {
  get(target, prop) {
    if (!validatedEnv) {
      validatedEnv = createEnv()
    }
    return validatedEnv[prop as keyof typeof validatedEnv]
  }
})

/**
 * Get environment variable with validation
 * Provides fallback values during development if not set
 * 
 * @param key - Environment variable key
 * @param options - Validation options
 * @returns The environment variable value
 */
function getEnvVar(
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

  // In development, provide helpful warnings instead of throwing
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️  Missing environment variable: ${key}\n` +
      `   Make sure .env.local is properly configured.\n` +
      `   See docs/01-overview/setup-guide.md for instructions.`
    )
    
    // Return safe fallbacks for development
    switch (key) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        return 'https://placeholder.supabase.co'
      case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
        return 'placeholder-anon-key'
      case 'SUPABASE_SERVICE_ROLE_KEY':
        return 'placeholder-service-role-key'
      default:
        return defaultValue || ''
    }
  }

  // In production, throw error
  throw new Error(
    `Missing required environment variable: ${key}\n` +
      `See docs/01-overview/setup-guide.md for setup instructions.`
  )
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return env.app.nodeEnv === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return env.app.nodeEnv === 'development'
}

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
    return env.allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed)
        return originUrl.protocol === allowedUrl.protocol &&
               originUrl.hostname === allowedUrl.hostname &&
               originUrl.port === allowedUrl.port
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}
