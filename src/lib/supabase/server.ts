/**
 * Supabase Server Client
 * 
 * Use this client in Server Components and Server Actions.
 * This client uses cookies for authentication and respects Row Level Security (RLS).
 * 
 * @example Server Component
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('tickets').select('*')
 *   return <div>{...}</div>
 * }
 * ```
 * 
 * @example Server Action
 * ```tsx
 * 'use server'
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export async function createTicket(formData: FormData) {
 *   const supabase = await createClient()
 *   const { data, error } = await supabase.from('tickets').insert({...})
 *   return { data, error }
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

