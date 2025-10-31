# Webpack Cache & CSS Loading - Troubleshooting Guide

## Problem Overview

This document explains the webpack cache corruption and CSS loading issues that were affecting the development environment, and the comprehensive solution implemented to prevent them.

---

## 🔴 **Issues Identified**

### Issue 1: `next.config.compiled.js` Warning

**Symptom:**
```
[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: Can't resolve
'C:\Users\sidne\Development\Projects\ticket-team\next.config.compiled.js'
```

**Root Cause:**
- Webpack cache configuration used `buildDependencies: { config: [__filename] }`
- `__filename` in TypeScript pointed to `next.config.ts`
- Webpack internally tried to resolve the compiled version (`next.config.compiled.js`)
- This transient file only exists during builds and gets cleaned up
- Cached references became stale, causing warnings on every build

**Impact:**
- Cache validation warnings on every build
- Gradual cache corruption over time
- Unnecessary overhead in cache validation

### Issue 2: CSS Not Loading (Broken Styles on localhost:3000)

**Symptom:**
- Styles fail to load completely
- Page renders without CSS
- Hot Module Replacement (HMR) breaks

**Root Causes:**

1. **Corrupted Webpack Cache (Primary)**
   - Cache grew to 730+ MB
   - Tailwind CSS v4 PostCSS transforms were heavily cached
   - When corruption occurred:
     - `@import "tailwindcss"` directives failed to compile
     - CSS chunks became unavailable or malformed
     - Cached PostCSS output was stale

2. **Race Conditions**
   - Despite `webpackBuildWorker: false`, race conditions still occurred
   - Multiple cache write operations conflicted
   - Incomplete cache entries were created during rapid file changes

3. **Sentry Wrapper Complexity**
   - `withSentryConfig()` adds webpack transformations
   - Additional instrumentation = more cache invalidation points
   - Source maps and telemetry created more cached artifacts

4. **Tailwind CSS v4 Specifics**
   - Uses `@tailwindcss/postcss` plugin
   - Generates CSS at build time from `@theme inline` and CSS variables
   - Heavy PostCSS processing = more cache dependencies
   - Any corruption in PostCSS cache breaks entire stylesheet

---

## ✅ **Solution Implemented**

### 1. Fixed Build Dependencies Configuration

**Change:** Replaced `__filename` with `package.json` as build dependency marker

```typescript
// Before (next.config.ts:36)
buildDependencies: {
  config: [__filename], // ❌ Caused "next.config.compiled.js" warnings
}

// After
buildDependencies: {
  config: [path.resolve(process.cwd(), 'package.json')], // ✅ Stable reference
}
```

**Benefits:**
- Eliminates `next.config.compiled.js` warnings completely
- Uses stable file that always exists
- Next.js still automatically invalidates cache on config changes via timestamp checks
- Bumped cache version to `'2'` to invalidate old caches

### 2. Added Cache Size & Age Limits

**Change:** Added max age limit to prevent bloat

```typescript
maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
profile: false, // Disable profiling for better performance
```

**Benefits:**
- Prevents cache from growing indefinitely
- Automatically expires old cache entries
- Reduces risk of corruption from stale data

### 3. Enhanced PostCSS/Tailwind CSS Handling

**Change:** Added explicit PostCSS config path resolution

```typescript
// Enhanced CSS/PostCSS handling for Tailwind CSS v4
// This helps prevent CSS cache corruption issues
const postcssLoaderIndex = config.module?.rules?.findIndex(...)
// ... explicitly sets postcss.config.mjs path
```

**Benefits:**
- Better cache invalidation for Tailwind CSS changes
- PostCSS loader always references correct config
- Reduces CSS compilation failures

### 4. Automatic Cache Health Check on Dev Start

**New File:** `scripts/pre-dev-check.ts`

**Features:**
- Runs automatically before `npm run dev`
- Checks cache health:
  - Size (> 500 MB = unhealthy)
  - Age (> 7 days = unhealthy)
  - Manifest corruption detection
- Auto-cleans cache if unhealthy
- Allows dev server to start with clean state

**Example Output:**
```
🔍 Pre-Development Cache Check
===============================

⚠ Cache health issues detected:
  • Cache too large (735 MB)
  • Cache too old (8.2 days)

🧹 Auto-cleaning cache...
  Removing .next...
  ✓ Cleaned .next
  Removing node_modules/.cache...
  ✓ Cleaned node_modules/.cache

✨ Cache cleaned successfully!
✓ Ready to start development server
```

### 5. Improved npm Scripts

**Updated Commands:**

```json
{
  "dev": "tsx scripts/pre-dev-check.ts && next dev", // ✅ Auto-checks cache health
  "dev:clean": "npm run clean:cache && npm run dev", // Force clean + dev
  "dev:safe": "npm run clean:cache && npm run check-db && next dev", // Clean + DB check
  "dev:unsafe": "next dev" // Skip cache check (not recommended)
}
```

**Usage:**
- `npm run dev` - **Recommended**: Auto-checks and cleans cache if needed
- `npm run dev:clean` - Force clean cache before starting
- `npm run dev:safe` - Clean cache + verify database connection
- `npm run dev:unsafe` - Skip checks (only use if checks are failing)

### 6. Updated .gitignore

**Added:**
```gitignore
next.config.compiled.js
next.config.compiled.mjs
```

Ensures transient compiled config files are never committed.

---

## 📋 **How to Use This Solution**

### Normal Development Workflow

**Just run:**
```bash
npm run dev
```

This now automatically:
1. Checks cache health
2. Cleans cache if needed
3. Starts dev server with clean state

### When You Experience Issues

**Step 1: Manual Cache Clean**
```bash
npm run clean:cache
```

**Step 2: Check Build Health**
```bash
npm run health
```

**Step 3: Safe Dev Start**
```bash
npm run dev:safe
```

### Commands Reference

| Command | When to Use |
|---------|-------------|
| `npm run dev` | **Daily development** - Auto-checks cache |
| `npm run dev:clean` | **CSS not loading** - Force clean first |
| `npm run dev:safe` | **Complete reset** - Clean + DB verify |
| `npm run clean:cache` | **Manual clean** - Clean without starting dev |
| `npm run health` | **Check status** - See cache health without cleaning |

---

## 🎯 **Expected Results**

### Before Solution

❌ Frequent issues:
- `next.config.compiled.js` warnings on every build
- CSS randomly stops loading
- Have to manually clean `.next` directory
- HMR breaks frequently
- Dev server requires frequent restarts

### After Solution

✅ Stable development:
- No more `next.config.compiled.js` warnings
- Cache automatically cleaned when needed
- CSS loads reliably
- HMR works consistently
- Fewer dev server restarts needed

---

## 🔧 **Technical Details**

### Why package.json as Build Dependency?

**Alternative Considered:** Using a custom marker file

**Why package.json?**
1. Always exists and is stable
2. Changes to dependencies often require cache invalidation anyway
3. Next.js still tracks config file changes via timestamps
4. Eliminates references to transient compiled files

### Cache Health Criteria

**Unhealthy Cache Indicators:**
1. **Size > 500 MB**: Cache bloat increases corruption risk
2. **Age > 7 days**: Stale cache likely has outdated module references
3. **Corrupted Manifests**: JSON parse errors indicate cache corruption

**Why Auto-Clean?**
- Prevents "CSS not loading" issues before they happen
- Developer doesn't need to remember to clean manually
- Zero friction - happens automatically

### PostCSS Config Resolution

**Problem:** Tailwind CSS v4 uses PostCSS at compile time
- Cache corruption in PostCSS transforms breaks CSS
- Need explicit config path for proper invalidation

**Solution:** Explicitly set `postcss.config.mjs` path
- Ensures PostCSS loader always finds config
- Better cache invalidation on Tailwind changes
- Reduces CSS compilation failures

---

## 🚨 **When to Seek Further Help**

If you still experience issues after these fixes:

1. **Cache keeps corrupting repeatedly**
   - Check disk space (low space can cause corruption)
   - Run `npm run health` to see specific issues
   - Check for antivirus interfering with `.next` directory

2. **CSS still not loading**
   - Clear browser cache (Ctrl+Shift+R)
   - Check browser console for specific errors
   - Verify `postcss.config.mjs` exists and is valid
   - Try `npm run build` to see if it's just a dev issue

3. **Dev server won't start**
   - Ensure port 3000 is not in use
   - Try `npm run dev:unsafe` to skip pre-checks
   - Check logs in `scripts/pre-dev-check.ts`

---

## 📚 **Related Documentation**

- [Next.js Webpack Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [Webpack Filesystem Cache](https://webpack.js.org/configuration/cache/#cachetype)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [PostCSS Configuration](https://github.com/postcss/postcss#usage)

---

## 🎉 **Summary**

This solution provides:
- ✅ Eliminated `next.config.compiled.js` warnings
- ✅ Automatic cache health monitoring
- ✅ Zero-friction cache cleanup
- ✅ Improved CSS reliability
- ✅ Better PostCSS/Tailwind handling
- ✅ Developer-friendly workflow

**Result:** Stable, reliable development environment with automatic cache management.
