/**
 * Supabase Client Utilities
 * 
 * Barrel export for easy imports
 */

export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
export { createServiceClient } from './service'
export { updateSession } from './middleware'

