# Cache and Environment Variable Issues

## Problem Summary

When environment variables are not loading properly in Next.js, you may encounter errors like:
- Connection to `placeholder.supabase.co`
- "Missing required environment variable" errors
- Next.js build/startup failures with missing manifest files
- Webpack cache race conditions

## Root Cause

Next.js bundles environment variables at build time into webpack cache files (`.next/cache/webpack/`). When you update `.env.local`, the old cached values can persist even after restarting the dev server.

**Critical Issue**: Deleting the entire `.next` directory while starting the dev server causes race conditions where Next.js tries to:
1. Read manifest files that don't exist yet
2. Write webpack cache files while simultaneously trying to read them
3. This results in ENOENT errors and file locking conflicts on Windows

## Solution

### Quick Fix (Recommended)

Use the safe cache cleanup script that only removes webpack cache while preserving manifests:

```bash
npm run clean:cache
npm run dev
```

This script:
- ✅ Only removes `.next/cache/webpack/` (cached bundles)
- ✅ Preserves manifests (`.next/*.json`, `.next/server/*.json`)
- ✅ Prevents race conditions
- ✅ Allows faster startup

### Manual Steps

If you need to manually clean the cache:

1. **Stop the dev server** (Ctrl+C)

2. **Kill any lingering Node processes**:
   ```bash
   # Windows
   taskkill //F //IM node.exe //T

   # Linux/Mac
   pkill -f "node.*next"
   ```

3. **Clean only the webpack cache**:
   ```bash
   # Windows
   rmdir /s /q .next\cache\webpack

   # Linux/Mac
   rm -rf .next/cache/webpack
   ```

4. **Verify .env.local exists and has correct values**:
   ```bash
   npm run check-env
   ```

5. **Start the dev server**:
   ```bash
   npm run dev
   ```

### What NOT to Do

❌ **NEVER delete the entire `.next` directory while the dev server might start**
   - This causes race conditions and manifest errors
   - Use `npm run clean:cache` instead

❌ **NEVER use `force-clean-restart.bat` unless absolutely necessary**
   - This is a "nuclear option" that can cause startup issues
   - Only use if instructed by troubleshooting guide

## Prevention

### 1. Updated Cache Cleanup Script

The project now has a safe cache cleanup script ([scripts/clean-cache.ts](../../scripts/clean-cache.ts)) that:
- Only removes webpack cache, not the entire `.next` directory
- Checks if dev server is running before cleaning
- Preserves manifest files to prevent race conditions

### 2. Environment Variable Validation

The [src/lib/env.ts](../../src/lib/env.ts) file now:
- ✅ Throws explicit errors instead of silent fallbacks
- ✅ Provides helpful error messages with fix steps
- ✅ Never returns placeholder values like `placeholder.supabase.co`

### 3. Next.js Configuration

The [next.config.ts](../../next.config.ts) has been optimized:
- `webpackBuildWorker: false` - Prevents filesystem race conditions
- Proper webpack cache configuration with file locking
- Deterministic module and chunk IDs for consistent builds

## Troubleshooting Steps

### Issue: Environment variables not loading

**Symptoms:**
- Connection errors to `placeholder.supabase.co`
- "Missing required environment variable" errors

**Fix:**
```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Check environment variables are set
npm run check-env

# 3. Clean cache and restart
npm run clean:cache
npm run dev
```

### Issue: Next.js startup errors (manifest/cache issues)

**Symptoms:**
```
Cannot find module 'middleware-manifest.json'
ENOENT: no such file or directory, stat '.next\cache\webpack\...'
```

**Fix:**
```bash
# 1. Kill all Node processes
taskkill //F //IM node.exe //T   # Windows
# or
pkill -f "node.*next"            # Linux/Mac

# 2. Safe cache cleanup
npm run clean:cache

# 3. Start dev server
npm run dev
```

### Issue: Persistent cache corruption

**Symptoms:**
- Build errors that don't go away after cleaning cache
- Module resolution errors
- Inconsistent build results

**Fix:**
```bash
# 1. Stop dev server and kill processes
# (see above)

# 2. Remove entire .next directory (ONLY when dev server is stopped)
rm -rf .next

# 3. Clean node_modules cache
rm -rf node_modules/.cache

# 4. Reinstall dependencies (if needed)
npm ci

# 5. Start fresh
npm run dev
```

## Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `npm run dev` | Start dev server normally | Default development |
| `npm run dev:clean` | Clean cache + start server | After pulling changes, env updates |
| `npm run clean:cache` | Safe cache cleanup only | When env vars aren't loading |
| `npm run check-env` | Validate environment variables | Diagnose env issues |
| `npm run health` | Check build health | Diagnose build/cache issues |

## Technical Details

### Why This Happens

1. **Webpack Caching**: Next.js uses webpack to bundle code, including environment variables
2. **Build-Time Bundling**: `NEXT_PUBLIC_*` variables are embedded in client bundles at build time
3. **Cache Persistence**: Webpack cache persists across restarts for faster builds
4. **Race Conditions**: Deleting `.next` while starting causes file access conflicts

### Safe Cache Cleanup Implementation

The [scripts/clean-cache.ts](../../scripts/clean-cache.ts) script:

```typescript
const dirsToClean = [
  { path: webpackCacheDir, name: '.next/cache/webpack' },  // ✅ Safe
  { path: nodeModulesCacheDir, name: 'node_modules/.cache' }, // ✅ Safe
];

// ❌ NOT deleted: .next/server/*, .next/*.json (manifests)
```

This approach:
- ✅ Clears cached environment variables
- ✅ Preserves Next.js internal state
- ✅ Allows faster dev server startup
- ✅ Prevents race conditions

## Related Documentation

- [Setup Guide](../01-overview/setup-guide.md) - Initial environment setup
- [Development Guide](../06-development/development-guide.md) - Development workflow
- [Environment Variables](../01-overview/setup-guide.md#environment-variables) - Env var configuration

## Future Improvements

Potential improvements to further prevent these issues:

1. **Pre-commit Hook**: Validate environment variables before committing
2. **Startup Validation**: Add stricter checks in `instrumentation.ts`
3. **Cache Version Bumping**: Automatically invalidate cache when `.env.local` changes
4. **Better Error Messages**: More specific error messages for different failure modes

## Summary

**The Fix:**
1. ✅ Updated [scripts/clean-cache.ts](../../scripts/clean-cache.ts) to only remove webpack cache
2. ✅ Updated [src/lib/env.ts](../../src/lib/env.ts) to throw errors instead of silent fallbacks
3. ✅ [next.config.ts](../../next.config.ts) already configured to prevent race conditions

**To Prevent Future Issues:**
- Always use `npm run clean:cache` instead of manually deleting `.next`
- Never delete `.next` while dev server is running or starting
- Use `npm run check-env` to validate environment variables
- Use `npm run dev:clean` when pulling changes or updating env vars

**When Things Go Wrong:**
```bash
# Standard fix (works 95% of the time)
npm run clean:cache
npm run dev

# If that doesn't work
taskkill //F //IM node.exe //T  # Kill Node processes
npm run clean:cache
npm run dev
```
