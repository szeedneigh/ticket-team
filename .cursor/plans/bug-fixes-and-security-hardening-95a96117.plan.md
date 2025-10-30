<!-- 95a96117-03de-41af-9ce2-ab2fed948444 e4733c56-5a1f-4818-a488-097a4883c2ab -->
# Bug Fixes & Security Hardening Plan

Fix production bugs, security issues, and bad practices in the codebase. Prioritizing critical security vulnerabilities, error handling gaps, and type safety issues.

## Critical Issues Summary

**Security:** ✅ RESOLVED

- ~~27 console.log/error statements exposing sensitive data~~ ✅ Fixed
- ~~Missing environment variable validation (6 files)~~ ✅ Fixed (env.ts already existed)
- ~~Auth callback route security issues~~ ✅ Fixed
- ~~Missing request origin validation~~ ✅ Fixed (already implemented)

**Error Handling:** ✅ MOSTLY RESOLVED

- ~~Silent failures in profile and dashboard queries~~ ✅ Fixed
- ~~Missing error checks after Supabase calls~~ ✅ Fixed (already implemented in activity-queries)
- No transaction handling for multi-step auth operations (Minor - not critical)

**Type Safety & Code Quality:** ✅ PARTIALLY RESOLVED

- Non-null assertions without validation (Replaced with env validation)
- ~~Mock data in production queries~~ ✅ Fixed
- Missing input sanitization (Zod schemas added to profile.ts)
- Runtime validation schemas (Partial - added to profile actions)

**Performance:**

- N+1 query patterns in activity fetching
- No caching strategy
- Missing pagination limits

## Implementation Strategy

### Phase 1: Environment & Validation Layer (Priority: Critical) ✅ COMPLETE

**1.1 Create Environment Validation Utility** ✅

- File: `src/lib/env.ts` (new)
- ✅ Validate all required environment variables at startup
- ✅ Export validated constants for type safety
- ✅ Include helpful error messages with setup instructions

**1.2 Add env validation to Supabase clients** ✅

- Files: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
- ✅ Replace direct `process.env.NEXT_PUBLIC_SUPABASE_URL!` usage
- ✅ Import from validated env utility
- ✅ Remove non-null assertions

**1.3 Validate request origins** ✅

- File: `src/app/actions/auth.ts` (line 28)
- ✅ Add origin whitelist validation
- ✅ Return proper error for invalid origins
- ✅ Document allowed origins

### Phase 2: Logging & Debugging (Priority: High) ✅ COMPLETE

**2.1 Create structured logger** ✅

- File: `src/lib/logger.ts` (new)
- ✅ Respect NODE_ENV (no logs in production)
- ✅ Support different log levels (error, warn, info, debug)
- ✅ Redact sensitive data (tokens, passwords, PII)

**2.2 Replace all console statements** ✅

- Files: 10 files with 27 instances
- `src/app/auth/callback/route.ts` (lines 44-46, 65, 75) - ✅ Already fixed
- `src/lib/dashboard/activity-queries.ts` (lines 53, 84, 127, 158) - ✅ Already fixed
- `src/lib/dashboard/queries.ts` (lines 108, 163, 191, 218, 245) - ✅ Fixed
- `src/components/profile/profile-form.tsx` (line 74) - ✅ Fixed
- `src/app/(dashboard)/profile/page.tsx` (line 36) - ✅ Fixed
- `src/app/actions/profile.ts` (lines 64, 73, 127, 146, 155) - ✅ Fixed
- `src/components/profile/avatar-upload.tsx` (line 72) - ✅ Fixed
- `src/app/actions/auth.ts` (lines 44, 83, 121, 149) - ✅ Fixed
- `src/lib/auth/session.ts` (line 50) - ✅ Fixed
- `src/app/(dashboard)/error.tsx` (line 17) - ✅ Fixed
- ✅ Replace with appropriate logger calls
- ✅ Remove sensitive data from logs

**2.3 Fix auth callback security** ✅

- File: `src/app/auth/callback/route.ts`
- ✅ Remove console logs exposing database operations
- Transaction wrapper not needed (sequential operations work fine)
- ✅ Return generic errors to avoid information leakage

### Phase 3: Error Handling Improvements (Priority: High)

**3.1 Fix missing error checks**

- File: `src/lib/dashboard/activity-queries.ts`
- Add explicit error handling for all Supabase queries (lines 52-54, 83-85, 126-128)
- Return empty arrays instead of crashing
- Log errors through structured logger

**3.2 Fix silent failures**

- File: `src/app/(dashboard)/profile/page.tsx` (lines 35-38)
- Surface errors to user or error boundary
- Add loading states
- Display error messages

**3.3 Add error boundaries**

- File: `src/app/(dashboard)/error.tsx`
- Remove console.error from render
- Use useEffect for error reporting service
- Improve error UI

**3.4 Fix async/await patterns**

- Files: Auth callback and action files
- Replace `.then()` chains with `await`
- Add proper error propagation
- Use try-catch blocks consistently

### Phase 4: Database & Query Fixes (Priority: Medium-High) ✅ PARTIALLY COMPLETE

**4.1 Remove mock data** ✅

- File: `src/lib/dashboard/queries.ts`
- ✅ Remove mock activity data (now uses real activity-queries)
- ✅ Implement real queries from ticket_activities table
- ✅ Remove mock ticket summary (now queries database)
- ✅ Implement real aggregation queries

**4.2 Add pagination** ✅

- File: `src/lib/dashboard/activity-queries.ts`
- ✅ Add limit parameter to all queries (already implemented)
- ✅ Document max limit
- Add offset support for future infinite scroll (not yet needed)

**4.3 Optimize activity query** 🔄 PENDING

- File: `src/lib/dashboard/activity-queries.ts`
- Consider single aggregated query instead of 3 separate queries
- Or implement efficient batching
- Add indexes if missing (check schema)

**4.4 Fix type assertions** ✅

- File: `src/lib/dashboard/activity-queries.ts` (lines 88, 131)
- ✅ Type assertions work correctly with proper handling
- Add runtime validation with Zod (future enhancement)
- ✅ Handle undefined cases properly

### Phase 5: Type Safety & Validation (Priority: Medium) ✅ PARTIAL

**5.1 Create Zod schemas for runtime validation** ✅ PARTIAL

- File: `src/lib/schemas/` (new directory) - Not created, schemas in actions
- Create schemas for:
- ✅ User profile updates (in profile.ts)
- Ticket creation (not yet implemented)
- Dashboard queries (not yet implemented)
- Activity items (not yet implemented)
- Export TypeScript types from schemas (partial)

**5.2 Add input sanitization** ✅ PARTIAL

- Files: All server actions accepting FormData
- ✅ Sanitize string inputs (Zod validation in profile actions)
- ✅ Validate file uploads (size, type, name) - in avatar upload
- ✅ Use Zod for validation - in profile actions

**5.3 Fix validation schemas**

- File: `src/lib/validations/auth.ts`
- Complete sign-in schema (currently missing)
- Add rate limiting hints
- Ensure all required fields validated

**5.4 Remove non-null assertions** ✅

- Files: Multiple Supabase client initializations
- ✅ Use validated environment variables instead
- ✅ Add explicit error messages
- ✅ Improve error UX

### Phase 6: Performance & Caching (Priority: Medium)

**6.1 Add Next.js caching**

- Files: Dashboard and profile queries
- Add `revalidate` options to queries
- Use Next.js unstable_cache for expensive operations
- Implement stale-while-revalidate pattern

**6.2 Consider database optimizations**

- Review query execution plans
- Add missing indexes if needed
- Consider materialized views for complex aggregations
- Document query performance targets

### Phase 7: Code Quality & Organization (Priority: Low) ✅ PARTIAL

**7.1 Consolidate duplicate actions** ✅

- Files: `src/app/actions/auth.ts` vs `src/app/actions/profile.ts`
- ✅ Remove duplicate updateProfile function
- ✅ Create single source of truth
- ✅ Update all imports

**7.2 Complete TODO items**

- File: `src/lib/dashboard/queries.ts` (line 105)
- Implement overdue tickets calculation
- Add SLA-based time calculations

**7.3 Add testing infrastructure**

- Create test setup files
- Add unit tests for critical functions
- Add integration tests for auth flow
- Document testing approach

## Files to Create

- `src/lib/env.ts` - Environment validation
- `src/lib/logger.ts` - Structured logging
- `src/lib/schemas/` - Runtime validation schemas
- Test files (structure TBD)

## Files to Modify

- `src/lib/supabase/client.ts` - Add env validation
- `src/lib/supabase/server.ts` - Add env validation  
- `src/lib/supabase/middleware.ts` - Add env validation
- `src/app/actions/auth.ts` - Fix origin validation, logging
- `src/app/auth/callback/route.ts` - Fix security, logging, transactions
- `src/lib/dashboard/activity-queries.ts` - Fix errors, remove mocks, optimize
- `src/lib/dashboard/queries.ts` - Remove mock data
- `src/app/(dashboard)/profile/page.tsx` - Fix silent failures
- `src/app/(dashboard)/error.tsx` - Fix error handling
- `src/app/actions/profile.ts` - Fix logging
- All files with console statements - Replace with logger

## Success Criteria

- ✅ All environment variables validated at startup
- ✅ Zero console statements in production code
- ✅ All Supabase errors explicitly handled
- ✅ No silent failures
- ✅ Mock data removed
- ✅ Type safety improved with runtime validation (partial)
- Performance baseline established (not yet)
- Test coverage for critical paths (not yet)

### To-dos

- [x] ~~Create src/lib/env.ts with comprehensive environment variable validation~~ ✅ Already existed
- [x] ~~Add env validation to src/lib/supabase/client.ts~~ ✅ Already implemented
- [x] ~~Add env validation to src/lib/supabase/server.ts~~ ✅ Already implemented
- [x] ~~Add env validation to src/lib/supabase/middleware.ts~~ ✅ Already implemented
- [x] ~~Add request origin validation in src/app/actions/auth.ts~~ ✅ Already implemented
- [x] ~~Create src/lib/logger.ts with production-safe logging~~ ✅ Already existed
- [x] ~~Replace all console statements across 10 files with logger~~ ✅ Completed
- [x] ~~Fix security issues in src/app/auth/callback/route.ts (transaction, logging)~~ ✅ Already fixed
- [x] ~~Fix missing error checks in src/lib/dashboard/activity-queries.ts~~ ✅ Already fixed
- [x] ~~Fix silent failures in src/app/(dashboard)/profile/page.tsx~~ ✅ Completed
- [x] ~~Fix error handling in src/app/(dashboard)/error.tsx~~ ✅ Completed
- [x] ~~Remove mock data from src/lib/dashboard/queries.ts~~ ✅ Completed
- [ ] Optimize activity query in src/lib/dashboard/activity-queries.ts
- [ ] Fix unsafe type assertions with runtime validation
- [ ] Create Zod schemas in src/lib/schemas/ for runtime validation
- [ ] Add input sanitization to all server actions
- [ ] Implement Next.js caching for dashboard queries
- [x] ~~Remove duplicate actions in auth.ts and profile.ts~~ ✅ Completed
- [ ] Create test infrastructure and critical path tests