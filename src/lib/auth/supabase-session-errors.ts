/**
 * Detect Supabase auth errors that mean the browser/server should clear the session.
 * Stale refresh tokens cause "Invalid Refresh Token: Refresh Token Not Found" and
 * repeated client-side refresh attempts until cookies are cleared.
 */

export function shouldClearSupabaseSession(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { message?: string; code?: string; status?: number }
  const msg = (e.message ?? '').toLowerCase()
  if (e.code === 'refresh_token_not_found') return true
  if (msg.includes('invalid refresh token')) return true
  if (msg.includes('refresh token') && msg.includes('not found')) return true
  if (e.status === 400 && msg.includes('refresh')) return true
  return false
}
