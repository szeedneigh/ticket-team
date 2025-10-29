/**
 * Supabase Browser Client
 * 
 * Use this client in Client Components that run in the browser.
 * This client uses the anonymous key and respects Row Level Security (RLS) policies.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase client...
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export function createClient() {
  return createBrowserClient(
    env.supabase.url,
    env.supabase.anonKey
  )
}

