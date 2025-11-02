/**
 * DEPRECATED: This file has been split for security reasons
 *
 * DO NOT USE THIS FILE DIRECTLY!
 *
 * This module has been split into separate client and server modules
 * to prevent accidentally exposing server-only secrets to the browser.
 *
 * For client-safe environment variables (in browser code):
 *   import { clientEnv } from '@/lib/env/client'
 *
 * For server-only environment variables (API routes, server components):
 *   import { serverEnv } from '@/lib/env/server'
 *
 * This file is kept for backwards compatibility but will throw errors
 * to guide developers to use the correct import.
 *
 * @deprecated Use @/lib/env/client or @/lib/env/server instead
 */

throw new Error(
  'DEPRECATED: @/lib/env has been split for security.\n\n' +
  'Use one of these instead:\n' +
  '  - import { clientEnv } from "@/lib/env/client"  // For client-side code\n' +
  '  - import { serverEnv } from "@/lib/env/server"  // For server-side code\n\n' +
  'See CLAUDE.md for migration guide.'
)

// Export types for backwards compatibility (these won't execute due to the throw above)
export type { } from './env/client'
