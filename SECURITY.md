# Security Policy

## Overview

This document outlines the security measures, best practices, and policies implemented in the TicketTeam application.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it to:
- **Email**: sidneyjohnsarcia@student.laverdad.edu.ph
- **Subject**: [SECURITY] TicketTeam Vulnerability Report

Please do NOT create public GitHub issues for security vulnerabilities.

## Security Measures Implemented

### 1. Authentication & Authorization

#### Google OAuth SSO
- **Provider**: Google OAuth 2.0
- **Domain Restriction**: Only `@laverdad.edu.ph` and `@student.laverdad.edu.ph` domains allowed
- **Session Management**: Supabase Auth with secure cookie-based sessions
- **Token Refresh**: Automatic token refresh via middleware

#### Role-Based Access Control (RBAC)
- **Roles**: `employee`, `staff`, `admin`, `super_admin`
- **Enforcement**: Row Level Security (RLS) policies in Supabase
- **Middleware Protection**: Server-side route protection for admin areas

### 2. Data Protection

#### Environment Variables
All sensitive credentials are stored in environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public, RLS-protected)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only, NEVER exposed to client)
- `GEMINI_API_KEY` - AI API key (server-only)
- `SENTRY_DSN` - Error tracking DSN
- `SENTRY_AUTH_TOKEN` - Sentry authentication token

#### Sensitive Data Handling
- **Passwords**: Never stored (Google OAuth only)
- **API Keys**: Server-side only, never exposed to client
- **Service Role Key**: Only used in server actions with explicit admin checks
- **Logging**: Automatic redaction of sensitive fields (passwords, tokens, API keys)

### 3. Security Headers

The following security headers are enforced via middleware:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Content-Security-Policy: [Strict CSP policy]
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (production only)
```

### 4. Content Security Policy (CSP)

Strict CSP policy to prevent XSS and injection attacks:
- Scripts: Self + Sentry CDN only
- Styles: Self + inline (for Tailwind)
- Images: Self + data URIs + HTTPS
- Connections: Self + Supabase + Sentry
- Frames: None (frame-ancestors 'none')

### 5. Input Validation & Sanitization

#### Validation Strategy
- **Client-side**: React Hook Form + Zod schemas (UX)
- **Server-side**: Zod schemas in server actions (security)
- **Database**: PostgreSQL constraints + RLS policies

#### Validation Examples
```typescript
// Profile update validation
const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
})

// Email domain validation
const allowedDomains = ['laverdad.edu.ph', 'student.laverdad.edu.ph']
const domain = email?.split('@')[1]
if (!domain || !allowedDomains.includes(domain)) {
  // Reject and clean up
}
```

### 6. Database Security

#### Row Level Security (RLS)
All tables have RLS policies enabled:
- Users can only read/update their own data
- Staff can view all tickets
- Admins have elevated permissions
- Service role bypasses RLS (used carefully)

#### Soft Deletes
- No hard deletes on domain records
- Deactivation instead of deletion for users
- Audit trail maintained via `deleted_at`, `deleted_by` fields

#### SQL Injection Prevention
- Parameterized queries via Supabase client
- No raw SQL from user input
- Type-safe TypeScript interfaces

### 7. Error Handling & Logging

#### Production Logging
- **Development**: Full logging with redacted sensitive data
- **Production**: No console logging, Sentry only
- **Sensitive Fields**: Automatically redacted (password, token, secret, api_key, etc.)

#### Error Monitoring
- **Sentry Integration**: Server and edge runtime monitoring
- **PII Protection**: `sendDefaultPii: false` in production
- **Sample Rate**: 10% in production, 100% in development
- **Header Filtering**: Authorization and Cookie headers removed

### 8. Rate Limiting

#### Current Implementation
- Supabase built-in rate limiting on auth endpoints
- Connection pooling limits (max 100 client connections)

#### Recommended Additions
- API route rate limiting (e.g., using `@upstash/ratelimit`)
- Per-user rate limits on ticket creation
- Brute force protection on authentication

### 9. CORS Configuration

#### Current Setup
- Origin validation in OAuth callback
- Allowed origins from environment variables
- Strict origin checking in server actions

### 10. Dependency Security

#### Audit Process
```bash
npm audit --production
```

#### Current Status
- ✅ No known vulnerabilities in production dependencies
- Regular dependency updates via Dependabot (recommended)

## Security Best Practices for Developers

### 1. Never Commit Secrets
- Use `.env.local` for local development
- Never commit `.env.local` to version control
- Use environment variables in CI/CD

### 2. Server vs Client Code
```typescript
// ✅ GOOD: Server-side API key usage
'use server'
import { env } from '@/lib/env'
const apiKey = env.gemini.apiKey

// ❌ BAD: Client-side API key exposure
'use client'
const apiKey = process.env.GEMINI_API_KEY // Exposed to browser!
```

### 3. Input Validation
- Always validate on server-side (primary)
- Client-side validation is for UX only
- Use Zod schemas for type-safe validation

### 4. Database Queries
```typescript
// ✅ GOOD: Parameterized query
await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// ❌ BAD: String interpolation (vulnerable to injection)
await supabase.rpc('raw_query', { 
  query: `SELECT * FROM users WHERE id = '${userId}'` 
})
```

### 5. Authentication Checks
```typescript
// ✅ GOOD: Require authentication
export async function updateProfile(formData: FormData) {
  const user = await getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  // ... proceed with update
}

// ❌ BAD: No authentication check
export async function updateProfile(formData: FormData) {
  // Anyone can call this!
}
```

## Security Checklist for Production

- [x] All secrets in environment variables
- [x] Sentry DSN not hardcoded
- [x] Security headers enabled
- [x] CSP policy configured
- [x] HSTS enabled in production
- [x] RLS policies on all tables
- [x] Input validation on all forms
- [x] Authentication required for protected routes
- [x] Role-based access control implemented
- [x] Sensitive data redacted in logs
- [x] No console.log in production
- [x] Dependencies audited
- [ ] Rate limiting on API routes (recommended)
- [ ] CAPTCHA on authentication (recommended)
- [ ] Automated security scanning in CI/CD (recommended)

## Compliance & Privacy

### Data Collection
- Minimal data collection (name, email, role)
- No tracking cookies
- No third-party analytics
- Sentry error tracking only

### GDPR Considerations
- User data deletion via deactivation
- Data export available on request
- Clear privacy policy (to be added)

## Incident Response

### In Case of Security Breach
1. Immediately rotate all API keys and secrets
2. Notify affected users
3. Document the incident
4. Implement fixes
5. Conduct post-mortem analysis

### Key Rotation Procedure
1. Generate new keys in Supabase/Sentry/Gemini dashboards
2. Update environment variables in production
3. Deploy updated configuration
4. Revoke old keys
5. Monitor for any issues

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Content Security Policy Reference](https://content-security-policy.com/)

## Version History

- **v1.0.0** (2025-01-30): Initial security policy
  - Implemented security headers
  - Configured Sentry with privacy controls
  - Documented security measures
  - Added input validation
  - Enabled RLS policies

