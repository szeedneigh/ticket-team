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
import { clientEnv } from '@/lib/env/client'
import { serverEnv } from '@/lib/env/server'

export function createServiceClient() {
  return createClient(
    clientEnv.supabase.url,
    serverEnv.supabaseService.roleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

