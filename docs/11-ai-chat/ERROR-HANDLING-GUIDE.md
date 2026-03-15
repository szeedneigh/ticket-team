# AI Chat Error Handling Guide

This guide documents the comprehensive error handling system implemented for the AI chat feature, including common errors, their causes, and how to debug them.

## Overview

The AI chat system uses a multi-layered error handling approach:

1. **Server-side error detection** - Catch errors in RAG pipeline
2. **Structured error logging** - Categorize and track errors
3. **User-friendly error messages** - Translate technical errors to actionable messages
4. **Client-side error handling** - Gracefully handle streaming failures
5. **Error monitoring** - Track errors for production debugging

## Common Errors

### 1. "I'm having trouble generating a response"

**Cause:** General failure in the RAG pipeline (embedding, retrieval, or generation)

**Possible Root Causes:**
- Gemini API key not configured or invalid
- Gemini API rate limiting (quota exceeded)
- Network connectivity issues to Gemini API
- Database connection problems
- Empty or malformed AI response

**Debugging:**
1. Check server logs for detailed error information:
   ```bash
   # Look for "Streaming RAG error:" entries
   tail -f logs/server.log | grep "Streaming RAG error"
   ```

2. Check environment variables:
   ```bash
   # Verify GEMINI_API_KEY is set
   echo $GEMINI_API_KEY
   ```

3. Test Gemini API connectivity:
   ```typescript
   import { isAIConfigured } from '@/lib/ai/client'
   console.log('AI configured:', isAIConfigured())
   ```

**Fix:**
- Verify `GEMINI_API_KEY` is set in environment variables
- Check Gemini API quota in Google Cloud Console
- Verify network connectivity to `generativelanguage.googleapis.com`
- Check Supabase connection status

---

### 2. "Failed to parse chunk"

**Cause:** Invalid JSON received in streaming response

**Possible Root Causes:**
- Server sent malformed JSON
- Network interruption corrupted data stream
- Client received partial chunk due to timeout
- Server error before JSON completion

**Debugging:**
1. Check console for raw chunk data:
   ```javascript
   // The error log includes the raw chunk:
   console.error('Raw chunk data:', data)
   ```

2. Verify SSE format in network tab:
   - Open DevTools → Network → find `/api/v1/ai/chat`
   - Check Response tab for proper `data: {...}` format

3. Check for network interruptions:
   - Look for connection drops or timeouts
   - Verify stable internet connection

**Fix:**
- The system now automatically retries on network errors
- Check server-side logs for errors before stream completes
- Verify all chunks end with proper JSON formatting

---

### 3. "Our AI assistant is experiencing high demand"

**Cause:** Gemini API rate limiting (HTTP 429)

**Possible Root Causes:**
- Too many requests per minute
- Quota exceeded for the day
- Concurrent request limits hit

**Debugging:**
1. Check Gemini API quotas:
   - Visit Google Cloud Console
   - Navigate to APIs & Services → Generative Language API
   - Check quota usage

2. Monitor rate of requests:
   ```typescript
   // Check error statistics
   import { getErrorStats } from '@/lib/monitoring/error-tracking'
   const stats = getErrorStats()
   console.log(stats)
   ```

**Fix:**
- Wait a few moments and retry
- Implement exponential backoff (already included in `@/lib/ai/client`)
- Increase API quota in Google Cloud Console
- Consider caching common queries

---

### 4. "Connection issue detected"

**Cause:** Network connectivity problems

**Possible Root Causes:**
- User's internet connection dropped
- DNS resolution failed
- Firewall blocking requests
- Server unreachable

**Debugging:**
1. Test network connectivity:
   ```bash
   # Ping Gemini API
   ping generativelanguage.googleapis.com
   
   # Test DNS resolution
   nslookup generativelanguage.googleapis.com
   ```

2. Check firewall rules:
   - Verify outbound HTTPS (443) allowed
   - Check for proxy settings

**Fix:**
- Verify internet connection
- Check firewall/proxy settings
- Retry the request

---

### 5. "Having trouble accessing the knowledge base"

**Cause:** Database query failure during context retrieval

**Possible Root Causes:**
- Supabase connection lost
- RPC function `match_kb_articles` failed
- pgvector extension issue
- Insufficient database permissions

**Debugging:**
1. Test Supabase connection:
   ```typescript
   import { createClient } from '@/lib/supabase/server'
   const supabase = await createClient()
   const { error } = await supabase.from('knowledge_articles').select('count')
   console.log('DB status:', error ? 'ERROR' : 'OK')
   ```

2. Verify pgvector function:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM match_kb_articles(
     query_embedding := ARRAY[0.1, 0.2, ...]::vector,
     match_threshold := 0.7,
     match_count := 5
   );
   ```

**Fix:**
- Check Supabase project status
- Verify RLS policies allow user access
- Ensure `match_kb_articles` function exists
- Check database connection limits

---

## Error Monitoring System

### Error Tracking Module

Location: `src/lib/monitoring/error-tracking.ts`

**Features:**
- **Error categorization** - Classifies errors by type (AI, DB, Network, Parsing)
- **Detailed logging** - Captures stack traces and context
- **Sentry integration** - Sends errors to Sentry in production
- **Error statistics** - Tracks error frequency and patterns

**Usage:**

```typescript
import {
  trackStreamingError,
  trackDatabaseError,
  trackNetworkError,
  trackParsingError,
  classifyError,
  isRetryableError,
} from '@/lib/monitoring/error-tracking'

// Track streaming errors
try {
  // ... RAG pipeline
} catch (error) {
  if (error instanceof Error) {
    trackStreamingError(error, userId, sessionId, query, 'generation')
  }
}

// Check if error can be retried
const shouldRetry = isRetryableError(error)
```

### Error Categories

```typescript
enum ErrorCategory {
  AI_API = 'ai_api',           // Gemini API errors
  DATABASE = 'database',        // Supabase/PostgreSQL errors
  NETWORK = 'network',          // Connectivity errors
  PARSING = 'parsing',          // JSON parsing errors
  VALIDATION = 'validation',    // Input validation errors
  UNKNOWN = 'unknown',          // Unclassified errors
}
```

### Viewing Error Statistics

In development, you can view error statistics:

```typescript
import { getErrorStats, clearErrorStats } from '@/lib/monitoring/error-tracking'

// Get current stats
const stats = getErrorStats()
for (const [key, stat] of stats) {
  console.log(`${key}: ${stat.count} occurrences, last: ${stat.lastOccurred}`)
}

// Clear stats (useful for testing)
clearErrorStats()
```

---

## Client-Side Error Handling

### ChatClient Component

Location: `src/components/chat/chat-client.tsx`

**Error Handling Features:**
- Catches streaming errors and parsing failures
- Removes optimistic user message on error
- Displays user-friendly error messages
- Shows toast notification for visibility
- Provides retry functionality
- Tracks errors for monitoring

**Error Flow:**
1. Error occurs during streaming
2. Error caught by try-catch block
3. Error classified and logged
4. User-friendly message determined
5. Error state set + toast shown
6. Optimistic message removed
7. User can retry via input component

### ChatInput Component

Location: `src/components/chat/chat-input.tsx`

**Error Display:**
- Shows error banner above input
- Includes retry button if available
- Disables input during error state
- Clears error on successful retry

---

## Server-Side Error Handling

### RAG Service

Location: `src/lib/chat/rag-service.ts`

**Error Handling:**
- Catches errors in streaming pipeline
- Determines failure stage (embedding, retrieval, generation, parsing)
- Provides user-friendly error messages
- Yields error chunk to client
- Logs detailed error information

**Error Stream Format:**
```typescript
{
  type: 'error',
  error: 'User-friendly error message'
}
```

### API Route

Location: `src/app/api/v1/ai/chat/route.ts`

**Error Handling:**
- Validates request before processing
- Catches streaming errors
- Tracks errors with user context
- Sends SSE error event to client
- Returns appropriate HTTP status codes

---

## Best Practices

### For Developers

1. **Always use structured error tracking:**
   ```typescript
   try {
     // risky operation
   } catch (error) {
     if (error instanceof Error) {
       trackError(error, { category, userId, sessionId })
     }
   }
   ```

2. **Provide user-friendly messages:**
   ```typescript
   // Bad
   throw new Error('ENOTFOUND: generativelanguage.googleapis.com')
   
   // Good
   throw new Error('Connection issue detected. Please check your internet and try again.')
   ```

3. **Include retry logic for transient errors:**
   ```typescript
   if (isRetryableError(error)) {
     // Show retry button
     setCanRetry(true)
   }
   ```

4. **Log enough context for debugging:**
   ```typescript
   console.error('Error details:', {
     message: error.message,
     stack: error.stack,
     userId,
     sessionId,
     stage: 'embedding',
   })
   ```

### For Operations

1. **Monitor error rates in Sentry**
   - Set up alerts for error spikes
   - Review error trends weekly

2. **Check error statistics regularly:**
   ```typescript
   const stats = getErrorStats()
   // Review which errors are most common
   ```

3. **Verify environment configuration:**
   - `GEMINI_API_KEY` set correctly
   - `SUPABASE_SERVICE_ROLE_KEY` set correctly
   - Database migrations applied
   - pgvector extension enabled

4. **Monitor API quotas:**
   - Gemini API quota usage
   - Supabase database connections
   - Vercel function execution time

---

## Testing Error Scenarios

### Simulate Errors for Testing

```typescript
// Test quota error
throw new Error('Quota exceeded (429)')

// Test network error
throw new Error('Network request failed: ENOTFOUND')

// Test parsing error
const malformedJson = 'data: {invalid json}\n\n'

// Test database error
throw new Error('Failed to retrieve context from database')
```

### Verify Error Handling

1. **Check error is logged:**
   - Open browser console
   - Verify "Error details:" logged with full context

2. **Check error is displayed:**
   - Error banner shown in chat input
   - Toast notification appears
   - User message removed from chat

3. **Check retry functionality:**
   - Retry button enabled for retryable errors
   - Clicking retry re-sends last message
   - Error cleared on successful retry

4. **Check monitoring:**
   - Error tracked in Sentry (production)
   - Error statistics updated
   - Proper categorization applied

---

## Debugging Checklist

When investigating a chat error:

- [ ] Check browser console for detailed error logs
- [ ] Check Network tab for failed requests
- [ ] Review server logs for backend errors
- [ ] Verify environment variables configured
- [ ] Test Gemini API connectivity
- [ ] Test Supabase connectivity
- [ ] Check API quota status
- [ ] Review error statistics
- [ ] Check Sentry for patterns
- [ ] Verify database migrations applied
- [ ] Test with different queries/users
- [ ] Check for network interruptions

---

## Additional Resources

- [RAG Service Documentation](./TECHNICAL-DOCUMENTATION.md)
- [AI Client Documentation](../02-architecture/ai-integration.md)
- [Error Monitoring Setup](../06-development/monitoring-and-logging.md)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Supabase Error Handling](https://supabase.com/docs/guides/platform/error-handling)

