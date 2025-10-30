# Common Issues

> Frequently asked questions and known problems with solutions.

## Table of Contents
- [Authentication](#authentication)
- [RLS Denied](#rls-denied)
- [Environment Variables](#environment-variables)
- [CORS](#cors)
- [Rate Limits](#rate-limits)
- [Build Errors](#build-errors)
- [Webpack Cache Race Condition](#webpack-cache-race-condition)
- [References](#references)

## Authentication
Problem: Login fails unexpectedly.

Fix:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Check Supabase Auth settings and email provider configuration.

## RLS Denied
Problem: Queries return empty or `permission denied for table`.

Fix:
- Confirm user role and RLS policies.
- Test policies in Supabase SQL Editor with `auth.uid()` context.

## Environment Variables
Problem: App runs locally but fails in production.

Fix:
- Ensure all required env vars are set in Vercel.
- Rebuild after updating env vars.

## CORS
Problem: Browser blocks requests to Supabase/PostgREST.

Fix:
- Use Supabase client with the project URL.
- For custom API routes, set appropriate CORS headers.

## Rate Limits
Problem: `429 Too Many Requests` from Gemini or APIs.

Fix:
- Implement exponential backoff.
- Cache results where possible.

## Build Errors
Problem: Type errors or missing modules.

Fix:
- Run `npm ci && npm run build` locally to reproduce.
- Check Node version and lockfile consistency.

## Webpack Cache Race Condition

**Problem**: Development server crashes with `ENOENT: no such file or directory, stat '.next/cache/webpack/server-development/0.pack.gz'` during concurrent page compilations.

**Symptoms**:
- Long compilation times (30+ seconds) followed by sudden crashes
- Error occurs when compiling fallback pages like `/_not-found` after successful page compilation
- Multiple webpack cache files being accessed simultaneously
- Request fails with 500 error even though the primary page compiled successfully

**Root Cause**: 
Race condition in Next.js webpack cache where concurrent compilation processes (or cache cleanup routines) attempt to read/write/delete the same cache files simultaneously. This is exacerbated by:
- Large module counts (4000+ modules) increasing compilation time and cache pressure
- Multiple compilation targets (client, server, fallback pages) running concurrently
- Insufficient file locking mechanisms in webpack's filesystem cache
- Cache fragmentation in development mode

**Immediate Fix**:
1. Stop the development server (Ctrl+C)
2. Clean the cache safely:
   ```bash
   npm run clean:cache
   ```
3. Restart the development server:
   ```bash
   npm run dev
   ```

**Prevention** (already implemented in `next.config.ts`):
- ✅ Webpack filesystem cache configured with proper locking and versioning
- ✅ Separate cache names for server/client to prevent collisions
- ✅ Reduced parallelism to limit concurrent compilation pressure
- ✅ Deterministic module/chunk IDs to reduce cache churn
- ✅ Idle timeout configured to clean up stale locks
- ✅ Memory cache layers to reduce filesystem access

**Best Practices**:
- Use `npm run dev:clean` to start with a fresh cache when encountering persistent issues
- Run `npm run clean:cache` weekly during active development to prevent cache bloat
- Monitor compilation times - consistently long builds (>30s) indicate cache issues
- Restart dev server after major dependency updates or branch switches

**Technical Details**:
The webpack configuration in `next.config.ts` now includes:
- File locking via `store: 'pack'` with gzip compression
- Cache versioning to invalidate on config changes
- Reduced `maxMemoryGenerations` to limit memory pressure
- `idleTimeout` settings to automatically clean stale locks
- Separate cache directories per compilation target

**If Issue Persists**:
1. Check for external processes accessing `.next` directory (antivirus, file sync tools)
2. Ensure adequate disk space and IOPS capacity
3. On Windows: Check if Windows Defender is scanning `.next` directory - add exclusion if needed
4. Review recent changes to `next.config.ts` or webpack plugins
5. Consider upgrading to latest Next.js version with cache fixes

**Related Configuration Files**:
- `next.config.ts` - Webpack cache configuration
- `scripts/clean-cache.ts` - Safe cache cleanup utility
- `package.json` - Cache management scripts

## References
- See also: [Debugging](./debugging.md)
- See also: [Setup Guide](../01-overview/setup-guide.md)
