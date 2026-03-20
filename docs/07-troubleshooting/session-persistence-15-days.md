# Session Persistence (15 Days)

## Overview

The application is configured so users stay logged in for up to 15 days (or longer) without re-authenticating. This is achieved through:

1. **JWT expiry** — Access tokens valid for 7 days (max allowed by Supabase)
2. **Refresh tokens** — Automatically rotate; sessions persist until sign-out by default
3. **Cookie persistence** — Supabase SSR uses cookies with ~400-day maxAge

## Local Development (config.toml)

For local Supabase, `supabase/config.toml` sets:

```toml
jwt_expiry = 604800  # 7 days in seconds
```

## Hosted Supabase (Production)

For production on Vercel with hosted Supabase:

### 1. JWT Settings

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. **Authentication** → **Settings** → **JWT Settings**
3. Set **JWT expiry** to `604800` (7 days) or your desired value

### 2. Session Settings

1. **Authentication** → **Sessions**
2. Ensure **Inactivity timeout** is not set (or set to 15+ days if on Pro)
3. Ensure **Time-box user sessions** is not set (or set to 15+ days if on Pro)
4. Default behavior keeps sessions until the user signs out

### 3. Cookie Persistence

Supabase SSR (`@supabase/ssr`) uses cookies with `maxAge: 400 * 24 * 60 * 60` (~400 days) by default. No code changes are needed for 15-day persistence.

## How It Works

- **Access token (JWT):** Short-lived; expires after 7 days
- **Refresh token:** Used to obtain new access tokens; does not expire by default
- **Cookies:** Store session; persist across browser restarts
- **Middleware:** Refreshes the session on each request

When a user returns after 15 days:

1. Cookies still contain the refresh token
2. Middleware calls `supabase.auth.getUser()`, which triggers a refresh
3. New access and refresh tokens are issued
4. User remains logged in

## Troubleshooting

### User Logged Out Unexpectedly

- **Clear session:** Visit `/auth/clear-session` and sign in again
- **Check Dashboard:** Verify JWT expiry and session settings in Supabase
- **Browser:** Ensure cookies are not blocked or cleared on exit

### After Database Reset

1. Visit `/auth/clear-session`
2. Sign in again

## Related Files

- `supabase/config.toml` — Local JWT expiry
- `src/lib/supabase/middleware.ts` — Session refresh
- `src/components/auth/auth-error-boundary.tsx` — Session monitor
- [auth-refresh-token-fix.md](./auth-refresh-token-fix.md) — Refresh token errors
