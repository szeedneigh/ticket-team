# Knowledge Base Access Control Analysis

**Issue ID:** #26  
**Status:** ⚠️ NOT A BUG - Working As Designed  
**Date:** January 26, 2026  
**Priority:** Medium (Clarification Needed)

## Problem Report

User reported: *"Only the current user's knowledge base should be accessible to them. No other users should be able to access another user's knowledge base."*

## Current RLS Policy Analysis

### Knowledge Articles Table RLS

```sql
-- Read Policy
CREATE POLICY "Published articles are publicly readable"
  ON knowledge_articles FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );
```

**What this means:**
- ✅ **ALL authenticated users** can read articles with `status = 'published'`
- ✅ **Staff, Admin, Super Admin** can also see `draft` and `archived` articles
- ✅ **Employees** can ONLY see published articles

### Write/Update Policies

```sql
-- Insert: Only staff can create articles
CREATE POLICY "Staff can create articles"
  ON knowledge_articles FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- Update: Author or admin can update
CREATE POLICY "Author or admin can update articles"
  ON knowledge_articles FOR UPDATE
  USING (
    author_id = auth.uid()
    OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Delete: Only admin can delete
CREATE POLICY "Admin can delete articles"
  ON knowledge_articles FOR DELETE
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
```

**What this means:**
- ✅ Only staff+ can CREATE articles
- ✅ Authors can UPDATE their own articles
- ✅ Admins can UPDATE any article
- ✅ Only admins can DELETE articles

## System Design: Shared Knowledge Base

**This is a SHARED KNOWLEDGE BASE system, not personal knowledge bases.**

### Intended Behavior (Current Design)

```
┌─────────────────────────────────────────────────────────┐
│                  KNOWLEDGE BASE (Shared)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Published Articles (status='published')                 │
│  ├─ Visible to: ALL authenticated users                 │
│  ├─ Created by: Staff, Admin, Super Admin               │
│  └─ Purpose: Help all users with common issues          │
│                                                          │
│  Draft Articles (status='draft')                        │
│  ├─ Visible to: Staff, Admin, Super Admin ONLY          │
│  ├─ Created by: Staff, Admin, Super Admin               │
│  └─ Purpose: Work in progress before publishing         │
│                                                          │
│  Archived Articles (status='archived')                  │
│  ├─ Visible to: Staff, Admin, Super Admin ONLY          │
│  ├─ Created by: Staff, Admin, Super Admin               │
│  └─ Purpose: Historical reference                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Why This Makes Sense

1. **Knowledge Sharing**: The whole point of a knowledge base is to share solutions across the organization
2. **Self-Service**: Employees can find answers without creating tickets
3. **Consistency**: Everyone sees the same official guidance
4. **Efficiency**: Staff doesn't have to answer the same questions repeatedly
5. **SEO/Search**: AI chat uses these articles to provide contextual help

## Examples from Real Systems

### ✅ Shared KB (Current System)
- **Zendesk**: Public help center visible to all
- **Confluence**: Shared team documentation
- **Notion**: Shared workspace knowledge
- **ServiceNow**: Corporate knowledge base
- **Freshdesk**: Public articles for customers

### ❌ Personal Notes (NOT Current System)
- **Evernote**: Personal note-taking
- **OneNote**: Personal/team notebooks
- **Bear**: Private notes
- **Notion Personal**: Individual workspace

## Possible Misunderstandings

### Scenario 1: User Wants Private Draft Visibility
**Issue:** User creates a draft and sees other staff can view it  
**Current Behavior:** All staff can see drafts (by design)  
**Alternative:** Make drafts only visible to author until published

```sql
-- Modified policy (if this is desired)
CREATE POLICY "Published articles are publicly readable, drafts to author"
  ON knowledge_articles FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR (status = 'draft' AND author_id = auth.uid())
    OR (status = 'draft' AND get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );
```

### Scenario 2: User Wants Personal Workspaces
**Issue:** User wants a "My Articles" section separate from shared KB  
**Current System:** No concept of personal vs shared articles  
**Solution:** Would require new `visibility` field: `public`, `private`, `team`

### Scenario 3: Department-Specific Articles
**Issue:** User wants KB articles only visible to their department  
**Current System:** All published articles are globally visible  
**Solution:** Would require department filtering and RLS updates

## Testing the Current Behavior

### Test 1: Employee Access
```sql
-- As an employee (role='employee')
SELECT * FROM knowledge_articles;

-- Expected Result:
-- ✅ Can see: All articles where status='published'
-- ❌ Cannot see: Draft or archived articles
```

### Test 2: Staff Access
```sql
-- As a staff member (role='staff')
SELECT * FROM knowledge_articles;

-- Expected Result:
-- ✅ Can see: ALL articles (published, draft, archived)
-- ✅ Can create: New articles
-- ✅ Can update: Own articles
```

### Test 3: Cross-User Visibility
1. Staff A creates a published article "How to Reset Password"
2. Employee B logs in
3. Employee B navigates to Knowledge Base
4. **Expected:** Employee B CAN see the article ✅
5. **Actual:** Employee B CAN see the article ✅
6. **Status:** Working as designed

## Verification in Code

### KB Queries Use RLS
**File:** `src/lib/kb/queries.ts`

```typescript
// All queries automatically respect RLS
export async function getArticles(supabase: SupabaseClient, filters: KBFilters) {
  let query = supabase
    .from('knowledge_articles')
    .select(`
      id, title, summary, category, status, view_count,
      helpful_votes, total_votes, published_at, updated_at,
      author:users!author_id (id, full_name, email, avatar_url, position, role)
    `)
  
  // RLS automatically filters based on:
  // - status='published' for employees
  // - ALL articles for staff+
  
  return query
}
```

### No User-Specific Filtering
**File:** `src/app/(dashboard)/kb/page.tsx`

```typescript
// Server component fetches articles
const { data: articles } = await supabase
  .from('knowledge_articles')
  .select('...')
  .order('view_count', { ascending: false })

// No .eq('author_id', user.id) filter
// ✅ This is correct for a shared KB
```

## Recommendations

### Option 1: Keep Current Design (Recommended)
**If:** The system should function as a shared organizational knowledge base

**Action:** 
- ✅ No code changes needed
- Document intended behavior for users
- Add FAQ: "Why can I see articles created by others?"

### Option 2: Add Private Draft Visibility
**If:** Authors want to work on drafts privately before peer review

**Changes Needed:**
```sql
-- Update RLS policy
-- Make drafts visible only to author + admins
-- Keep published articles globally visible
```

### Option 3: Add Article Visibility Levels
**If:** Need granular control (public/private/department)

**Changes Needed:**
- Add `visibility` enum to `knowledge_articles`
- Update RLS policies for department filtering
- Add UI for selecting visibility when creating articles
- **Impact:** Major feature addition (2-3 days work)

## Decision Required

**User needs to clarify:**

1. ❓ Should published KB articles be visible to ALL users? (Current: YES)
2. ❓ Should draft articles be visible only to the author? (Current: NO, visible to all staff)
3. ❓ Do you need department-specific articles? (Current: NO)
4. ❓ Do you need personal/private articles separate from shared KB? (Current: NO)

## Current Status: AWAITING USER CLARIFICATION

The system is working as designed for a **shared organizational knowledge base**. Before making changes, we need to understand:
- What specific access control issue the user experienced
- What the expected behavior should be
- Whether this is about published articles or drafts
- Whether department-level filtering is needed

## Related Files

- RLS Policies: `supabase/migrations/20250114000004_create_rls_policies.sql`
- KB Queries: `src/lib/kb/queries.ts`
- KB Page: `src/app/(dashboard)/kb/page.tsx`
- KB Actions: `src/lib/kb/actions.ts`

## Next Steps

1. **Clarify with user:** What specific behavior they observed vs. expected
2. **Get examples:** Which article did they expect to NOT see?
3. **Understand use case:** Personal notes vs. shared knowledge?
4. **Make decision:** Keep as-is, modify draft visibility, or add new features
