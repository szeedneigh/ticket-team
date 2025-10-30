# Build Error Prevention - Quick Reference

## 🚨 Emergency Fixes

### Missing Module Errors (`Cannot find module './45.js'`)
```bash
npm run clean:cache
npm run dev
```

### Manifest File Errors (`ENOENT: manifest.json`)
```bash
npm run clean:cache
npm run dev
```

### Complete Build Corruption
```bash
rm -rf .next node_modules/.cache node_modules package-lock.json
npm install
npm run dev
```

---

## 📋 New Commands

| Command | When to Use | Description |
|---------|-------------|-------------|
| `npm run health` | Anytime | Check build health status |
| `npm run dev:safe` | After branch switch, dependency update | Clean start with DB check |
| `npm run build:clean` | Production builds | Build with fresh cache |
| `npm run clean:cache` | Build issues | Safe cache cleanup |

---

## ⚠️ Warning Signs

Watch for these indicators of cache corruption:

| Sign | Action |
|------|--------|
| Compilation time > 30s | Run `npm run clean:cache` |
| Missing module errors | Run `npm run clean:cache` |
| 500 errors on navigation | Run `npm run clean:cache` |
| ENOENT errors in terminal | Run `npm run clean:cache` |
| HMR failures | Run `npm run clean:cache` |

---

## 🔄 Daily Workflow

### Normal Development
```bash
npm run dev
```

### After Branch Switch
```bash
npm run dev:safe
```

### After Dependency Update
```bash
npm run dev:safe
```

### Before Production Build
```bash
npm run health
npm run build:clean
```

---

## 🎯 Best Practices

✅ **DO:**
- Run `npm run dev:safe` after branch switches
- Run `npm run health` before production builds
- Clean cache weekly: `npm run clean:cache`
- Monitor compilation times

❌ **DON'T:**
- Leave dev server running for days
- Ignore ENOENT errors
- Skip cache cleanup after major changes
- Commit `.next` directory

---

## 📊 Health Check Output

### All Good ✅
```
✓ Passed: 11
⚠ Warnings: 0
✗ Critical: 0

✨ All checks passed! Build is healthy.
```
**Action**: Continue development

### Warnings ⚠️
```
✓ Passed: 10
⚠ Warnings: 1
✗ Critical: 0

⚠️  Warnings Detected
Recommended: Clean cache for optimal performance
```
**Action**: Run `npm run clean:cache` when convenient

### Critical Issues 🚨
```
✓ Passed: 8
⚠ Warnings: 1
✗ Critical: 2

🚨 Critical Issues Detected!
Action required: Run cache cleanup
```
**Action**: Run `npm run clean:cache` immediately

---

## 🔍 Sentry Error Tags

Build corruption errors are now tagged in Sentry:

| Tag | Meaning |
|-----|---------|
| `error_category: webpack_cache` | Webpack module errors |
| `error_category: build_artifacts` | Missing manifest files |
| `error_category: webpack_runtime` | Bootstrap errors |
| `error_category: module_resolution` | Module loading errors |
| `error_category: chunk_loading` | Chunk load failures |
| `build_corruption: true` | All build-related errors |

**Filter in Sentry**: `build_corruption:true`

---

## 🛠️ What Changed

### Webpack Config (`next.config.ts`)
- ✅ Added `store: 'pack'` for file locking
- ✅ Disabled `webpackBuildWorker` (prevents race conditions)
- ✅ Added build dependencies tracking
- ✅ Added snapshot configuration
- ✅ Added production optimizations

### New Script (`scripts/check-build-health.ts`)
- ✅ Validates manifest files
- ✅ Checks webpack cache integrity
- ✅ Reports cache size and age
- ✅ Detects orphaned chunks

### Sentry Configs (All 3 files)
- ✅ Custom error fingerprinting
- ✅ Better error grouping
- ✅ Build corruption tagging

---

## 📞 Need Help?

1. **Check health**: `npm run health`
2. **Review this guide**: `docs/07-troubleshooting/QUICK_REFERENCE.md`
3. **Full documentation**: `docs/07-troubleshooting/build-error-prevention.md`
4. **Common issues**: `docs/07-troubleshooting/common-issues.md`

---

**Last Updated**: 2025-10-30

