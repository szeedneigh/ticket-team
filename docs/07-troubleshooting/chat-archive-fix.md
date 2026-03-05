# Chat Archive Functionality Fix

**Issue Date:** January 28, 2026  
**Status:** ✅ Fixed  
**Severity:** Medium - User Experience

## Problem Description

When archiving an AI chat conversation, the page would get stuck in a loading state indefinitely, preventing users from continuing to use the chat interface.

### Symptoms

1. Click "Archive" on a chat conversation
2. Confirmation dialog appears and user confirms
3. Toast notification shows "Conversation archived"
4. Page enters loading state with spinner
5. **Page never finishes loading** - stuck indefinitely

## Root Cause Analysis

### Primary Issues

1. **Race Condition in State Updates**
   - The archive handler updated multiple state variables in quick succession
   - When switching to a new session, the state updates hadn't fully propagated
   - This caused the session switch logic to operate on stale data

2. **Missing Error Recovery**
   - No timeout mechanism to recover from hanging network requests
   - No proper cleanup of loading state on failures
   - URL updates happened before verifying session data was available

3. **Improper Session Validation**
   - Didn't validate that the target session exists and is not archived
   - Could attempt to switch to an archived session, causing undefined behavior

## Solution Implementation

### 1. Added Safety Timeouts

**File:** `src/app/(dashboard)/analytics/chat/page-client.tsx`

Added 10-second timeout guards to prevent infinite loading:

```typescript
// In handleSessionSelect
const loadingTimeout = setTimeout(() => {
  console.error('Session selection timed out')
  setIsLoadingSession(false)
  toast.error('Loading session timed out. Please try again.')
}, 10000)

// Always cleanup
finally {
  clearTimeout(loadingTimeout)
  setIsLoadingSession(false)
}
```

### 2. Improved Session Validation

Validate session exists before attempting to switch:

```typescript
const result = await getChatSession(sessionId)

if (!result.success) {
  toast.error(result.error || 'Failed to load conversation')
  clearTimeout(loadingTimeout)
  setIsLoadingSession(false)
  return
}

if (!result.data) {
  // Session not found or archived - cannot switch to it
  toast.error('Conversation not found or has been archived')
  clearTimeout(loadingTimeout)
  setIsLoadingSession(false)
  return
}
```

### 3. Fixed URL Update Timing

Move URL update to happen AFTER successful data fetch:

```typescript
// ❌ BEFORE (wrong order)
// Update URL first
router.replace(`/chat?${params.toString()}`)
// Then fetch data
const result = await getChatSession(sessionId)

// ✅ AFTER (correct order)
// Fetch data first
const result = await getChatSession(sessionId)
// Validate it exists
if (!result.data) return
// Then update URL
router.replace(`/chat?${params.toString()}`)
```

### 4. Added State Update Delay in Archive Handler

Use `setTimeout` to ensure React state updates complete before navigation:

```typescript
// If archived session was active, switch to another
if (sessionId === activeSessionId) {
  // Use setTimeout to ensure state updates complete before navigation
  setTimeout(async () => {
    try {
      if (remainingSessions.length > 0) {
        await handleSessionSelect(remainingSessions[0].session_id)
      } else {
        await handleNewChat()
      }
    } catch (error) {
      console.error('Failed to switch session after archive:', error)
      toast.error('Failed to switch conversation')
      setIsLoadingSession(false) // Force reset loading state
    }
  }, 100)
}
```

### 5. Consistent Error Handling

Ensure all error paths properly reset the loading state:

```typescript
catch (error) {
  console.error('Failed to archive session:', error)
  toast.error('Failed to archive conversation')
  setIsLoadingSession(false) // ← Always reset loading state
}
```

## Database Schema Validation

The archive functionality uses the `archived_at` column in `ai_interactions`:

```sql
-- Migration: 20260111000001_add_chat_archiving.sql
ALTER TABLE ai_interactions 
  ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_ai_interactions_archived 
  ON ai_interactions(user_id, archived_at)
  WHERE archived_at IS NULL;
```

### Archive Query Implementation

**File:** `src/lib/chat/queries.ts`

```typescript
export async function archiveSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ai_interactions')
    .update({ archived_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .is('archived_at', null) // Only archive if not already archived

  if (error) {
    console.error('Error archiving session:', error)
    throw new Error(`Failed to archive session: ${error.message}`)
  }
}
```

### Session Filtering

All session queries now filter out archived sessions by default:

```typescript
// Get active sessions only
let query = supabase
  .from('ai_interactions')
  .select('session_id, query, created_at, escalated_to_ticket, metadata')
  .eq('user_id', userId)
  .is('archived_at', null) // ← Filter archived
  .order('created_at', { ascending: false })
```

## Testing Checklist

- [x] Archive a conversation while viewing it
- [x] Verify page switches to next available conversation
- [x] Archive the last conversation and verify new chat is created
- [x] Verify archived conversations are hidden from active list
- [x] View archived conversations in "Show Archived" mode
- [x] Verify timeout protection works (simulated slow network)
- [x] Test error recovery when server errors occur
- [x] Verify URL updates correctly after successful session switch

## User Experience Flow

### Before Fix

1. User clicks "Archive" on active conversation
2. Toast shows "Conversation archived"
3. 🔴 **Page stuck loading indefinitely**
4. User forced to refresh page

### After Fix

1. User clicks "Archive" on active conversation
2. Confirmation dialog appears
3. User confirms archive action
4. Toast shows "Conversation archived"
5. ✅ **Loading indicator appears briefly (< 1 second)**
6. ✅ **Page automatically switches to next conversation or creates new one**
7. ✅ **User can continue chatting immediately**

## Related Files Modified

1. `src/app/(dashboard)/analytics/chat/page-client.tsx`
   - Added timeout guards
   - Improved error handling
   - Fixed state update ordering

2. `src/lib/chat/queries.ts`
   - Archive functionality (already existed, no changes needed)
   - Proper filtering of archived sessions

3. `src/app/actions/chat.ts`
   - Archive server action (already existed, no changes needed)

## Performance Impact

- **Minimal:** Added only lightweight timeout guards
- **Network requests:** No additional requests
- **User experience:** Significantly improved (blocking bug fixed)

## Monitoring

### Error Tracking

The application logs the following events:

```typescript
// Success
console.log('Conversation archived successfully')

// Errors
console.error('Failed to archive session:', error)
console.error('Session selection timed out')
console.error('Failed to switch session after archive:', error)
```

### User Feedback

Toast notifications provide clear feedback:
- ✅ Success: "Conversation archived"
- ✅ Success: "New chat started"
- ❌ Error: "Failed to archive conversation"
- ❌ Error: "Failed to switch conversation"
- ⚠️ Timeout: "Loading session timed out. Please try again."

## Future Improvements

### Potential Enhancements

1. **Optimistic UI Updates**
   - Remove session from list immediately before server confirmation
   - Rollback on failure

2. **Undo Archive**
   - Add "Undo" button in toast notification
   - Restore archived conversation within time window

3. **Batch Archive**
   - Allow archiving multiple conversations at once
   - Useful for cleanup operations

4. **Archive Search**
   - Add search functionality in archived conversations view
   - Filter by date range

5. **Archive Analytics**
   - Track archive patterns
   - Identify frequently archived conversation types

## References

- Database Migration: `supabase/migrations/20260111000001_add_chat_archiving.sql`
- Chat Queries: `src/lib/chat/queries.ts`
- Chat Actions: `src/app/actions/chat.ts`
- Chat History UI: `src/components/chat/chat-history.tsx`
- Page Client: `src/app/(dashboard)/analytics/chat/page-client.tsx`

## Conclusion

The archive functionality now works reliably with proper error handling, timeout protection, and state management. Users can archive conversations without experiencing loading issues, significantly improving the user experience.
