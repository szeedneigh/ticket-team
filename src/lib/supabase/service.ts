/**
 * Supabase Service Role Client
 * 
 * ⚠️ DANGER: This client BYPASSES Row Level Security (RLS) policies!
 * Only use this for admin operations that require elevated privileges.
 * 
 * USE CASES:
 * - Admin user management (create/deactivate users)
 * - System-level operations (bulk updates, migrations)
 * - Background jobs and scheduled tasks
 * - Operations that need to access data across all users
 * 
 * NEVER expose this client to the frontend or client components!
 * 
 * @example Server-side Admin Operation
 * ```tsx
 * import { createServiceClient } from '@/lib/supabase/service'
 * 
 * export async function deactivateUser(userId: string) {
 *   const supabase = createServiceClient()
 *   
 *   // This bypasses RLS - use with caution!
 *   const { error } = await supabase
 *     .from('users')
 *     .update({ deactivated_at: new Date().toISOString() })
 *     .eq('id', userId)
 *   
 *   return { error }
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not defined. Add it to your .env.local file.'
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not defined. This is required for service role operations.'
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

