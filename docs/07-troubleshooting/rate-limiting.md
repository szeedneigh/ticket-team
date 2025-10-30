# Rate Limiting Strategy

> Guidelines and implementation for rate limiting in TicketTeam

## Table of Contents
- [Overview](#overview)
- [Current Implementation](#current-implementation)
- [Recommended Implementation](#recommended-implementation)
- [Configuration](#configuration)
- [Monitoring](#monitoring)

## Overview

Rate limiting is a critical security measure to prevent abuse, brute force attacks, and resource exhaustion. This document outlines the current and recommended rate limiting strategies for TicketTeam.

## Current Implementation

### Supabase Built-in Rate Limiting

Supabase provides automatic rate limiting on authentication endpoints:

- **Auth endpoints**: 30 requests per hour per IP
- **Database connections**: Max 100 concurrent client connections
- **Connection pooling**: Transaction mode with 20 connections per user/database pair

### Connection Pool Configuration

<augment_code_snippet path="supabase/config.toml" mode="EXCERPT">
````toml
[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
````
</augment_code_snippet>

## Recommended Implementation

### 1. API Route Rate Limiting

For production deployment, implement rate limiting on API routes using `@upstash/ratelimit`:

```bash
npm install @upstash/ratelimit @upstash/redis
```

#### Example Implementation

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a new ratelimiter that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
})

// Different limits for different endpoints
export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
})

export const ticketRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 tickets per hour
  analytics: true,
  prefix: "@upstash/ratelimit/tickets",
})
```

#### Usage in API Routes

```typescript
// app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ticketRateLimit } from '@/lib/rate-limit'
import { getUser } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit by user ID
  const { success, limit, reset, remaining } = await ticketRateLimit.limit(user.id)

  if (!success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        limit,
        reset,
        remaining 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }

  // Process ticket creation...
}
```

### 2. Middleware Rate Limiting

Add rate limiting to middleware for global protection:

```typescript
// middleware.ts (addition)
import { ratelimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Get IP address
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  
  // Apply rate limit
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Continue with authentication and session...
  const response = await updateSession(request)
  // ... rest of middleware
}
```

### 3. Server Action Rate Limiting

Protect server actions from abuse:

```typescript
// app/actions/profile.ts
import { authRateLimit } from '@/lib/rate-limit'

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Rate limit profile updates
  const { success } = await authRateLimit.limit(`profile:${user.id}`)
  if (!success) {
    return { 
      success: false, 
      error: 'Too many update attempts. Please try again later.' 
    }
  }

  // Process update...
}
```

## Configuration

### Rate Limit Tiers

Recommended rate limits by endpoint type:

| Endpoint Type | Limit | Window | Notes |
|--------------|-------|--------|-------|
| Authentication | 5 requests | 15 minutes | Prevent brute force |
| Ticket Creation | 20 requests | 1 hour | Prevent spam |
| Profile Updates | 10 requests | 1 hour | Normal usage |
| Search/Read | 100 requests | 1 minute | High read volume |
| Admin Actions | 50 requests | 1 minute | Elevated limits |

### Environment Variables

Add to `.env.local`:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Role-Based Limits

Different limits for different user roles:

```typescript
export function getRateLimitForRole(role: UserRole) {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(100, "1 m"),
      })
    case 'staff':
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(50, "1 m"),
      })
    default:
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, "1 m"),
      })
  }
}
```

## Monitoring

### Rate Limit Headers

Always include rate limit information in responses:

```typescript
headers: {
  'X-RateLimit-Limit': limit.toString(),
  'X-RateLimit-Remaining': remaining.toString(),
  'X-RateLimit-Reset': reset.toString(),
}
```

### Logging

Log rate limit violations for security monitoring:

```typescript
if (!success) {
  logger.warn('Rate limit exceeded', {
    userId: user.id,
    endpoint: request.url,
    ip: request.ip,
    limit,
    reset,
  })
}
```

### Analytics

Use Upstash Analytics to monitor rate limit patterns:

```typescript
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true, // Enable analytics
})
```

## Error Handling

### Client-Side Handling

```typescript
async function createTicket(data: TicketData) {
  const response = await fetch('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (response.status === 429) {
    const { reset } = await response.json()
    const resetDate = new Date(reset * 1000)
    
    toast.error(
      `Rate limit exceeded. Please try again at ${resetDate.toLocaleTimeString()}`
    )
    return
  }

  // Handle success...
}
```

### User Feedback

Provide clear feedback when rate limits are hit:

```typescript
if (!success) {
  const waitTime = Math.ceil((reset - Date.now()) / 1000 / 60)
  return {
    success: false,
    error: `Too many requests. Please wait ${waitTime} minutes before trying again.`
  }
}
```

## Testing

### Local Testing

Test rate limits in development:

```typescript
// Temporarily lower limits for testing
const testRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "10 s"), // Very low limit
})
```

### Load Testing

Use tools like `k6` or `artillery` to test rate limiting:

```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.post('http://localhost:3000/api/tickets', {
    title: 'Test ticket',
  });
  
  check(res, {
    'rate limit works': (r) => r.status === 429 || r.status === 200,
  });
}
```

## Best Practices

1. **Use sliding windows** instead of fixed windows for smoother rate limiting
2. **Rate limit by user ID** when authenticated, by IP when not
3. **Include rate limit headers** in all responses
4. **Log violations** for security monitoring
5. **Provide clear error messages** to users
6. **Different limits for different roles** (admin vs regular user)
7. **Monitor and adjust** limits based on actual usage patterns
8. **Test thoroughly** before deploying to production

## References

- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Supabase Rate Limits](https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting)

