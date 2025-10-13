# Common Issues

> Frequently asked questions and known problems with solutions.

## Table of Contents
- [Authentication](#authentication)
- [RLS Denied](#rls-denied)
- [Environment Variables](#environment-variables)
- [CORS](#cors)
- [Rate Limits](#rate-limits)
- [Build Errors](#build-errors)
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

## References
- See also: [Debugging](./debugging.md)
- See also: [Setup Guide](../01-overview/setup-guide.md)
