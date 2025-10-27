# Google SSO Authentication Setup Guide

This guide will help you configure Google Workspace SSO for TicketTeam.

## 🎯 Quick Start

The authentication system is fully implemented. You just need to configure the OAuth credentials.

---

## 📋 Prerequisites

- Google Workspace admin access for La Verdad Christian College
- Supabase project access
- Project environment variables access

---

## 🔧 Step 1: Configure Google Cloud Platform

### 1.1 Create/Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: **TicketTeam - La Verdad**

### 1.2 Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **Internal** (restricts to your Google Workspace domain)
3. Fill in application details:
   - **App name**: TicketTeam (or TicketTeam.app for custom branding)
   - **User support email**: your-email@laverdad.edu.ph
   - **Developer contact**: your-email@laverdad.edu.ph
4. Click **Save and Continue**
5. Skip scopes (default scopes are sufficient)
6. Review and submit

#### Domain Configuration Strategy

**Important**: The app does NOT pre-fill or restrict which email users can type at the Google sign-in screen. Instead:

✅ **Frontend**: Users have complete freedom to enter any Google account email  
✅ **Backend**: Domain validation happens in the callback route (`src/app/auth/callback/route.ts`)  
✅ **Allowed domains**: 
  - `@laverdad.edu.ph` (employees/staff)
  - `@student.laverdad.edu.ph` (students)  
✅ **Security**: Invalid domains are rejected with a clear error message

**This approach provides**:
- Better UX (no domain pre-fill confusion)
- Proper server-side security validation
- Clear feedback when wrong domain is used

### 1.3 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth client ID**
4. Choose **Web application**
5. Configure:

   **Name**: `TicketTeam Production`

   **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```

   **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
   ```

6. Click **CREATE**
7. **IMPORTANT**: Copy your **Client ID** and **Client Secret**

---

## 🗄️ Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Scroll to **Google** and click to expand
5. Toggle **Enable Sign in with Google**
6. Enter the credentials from Step 1.3:
   - **Client ID**: `[your-client-id].apps.googleusercontent.com`
   - **Client Secret**: `[your-client-secret]`
7. Copy the **Callback URL** (should be `https://[PROJECT-ID].supabase.co/auth/v1/callback`)
8. Click **Save**

### 2.2 Verify the Callback URL

Make sure the callback URL from Supabase is added to your Google OAuth configuration (you did this in Step 1.3).

---

## 🔐 Step 3: Set Environment Variables

Create or update `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Site URL (change for production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**For Production**, update:
```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### Finding Your Supabase Credentials

1. Go to Supabase Dashboard
2. Select your project
3. Click **Settings** (gear icon) > **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🧪 Step 4: Test Authentication

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test Sign In

1. Navigate to `http://localhost:3000/auth/sign-in`
2. Click **Sign in with Google**
3. You should be redirected to Google's consent screen
4. Sign in with a `@laverdad.edu.ph` or `@student.laverdad.edu.ph` account
5. Grant permissions
6. You should be redirected back to `/dashboard`

### 4.3 Verify User Creation

Check Supabase Dashboard:
1. Go to **Authentication** > **Users**
2. Your user should appear with:
   - Email from Google
   - Avatar URL from Google
   - User metadata populated

Also check:
1. **Table Editor** > **users** table
2. Your user record should exist with:
   - Full name from Google
   - Avatar URL from Google
   - Role set to `employee`

### 4.4 Test Domain Restriction

1. Try signing in with a non-school email (e.g., personal Gmail)
2. You should be redirected to `/auth/error?error=invalid_domain`
3. Error message should say: "Please use your La Verdad email address"

### 4.5 Test Sign Out

1. Click your avatar or sign-out button
2. You should be signed out and redirected to `/auth/sign-in`

---

## 🚀 Step 5: Production Deployment

### 5.1 Update Google OAuth

Add your production domain to Google Cloud Console:
- Authorized JavaScript origins: `https://your-domain.com`
- Authorized redirect URIs: `https://your-domain.com/auth/callback`

### 5.2 Update Environment Variables

In your hosting platform (Vercel, Netlify, etc.), set:
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 5.3 Deploy and Test

1. Deploy your application
2. Visit `https://your-domain.com/auth/sign-in`
3. Test Google sign-in with school email
4. Verify everything works

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check Google Cloud Console > Credentials > OAuth 2.0 Client IDs
2. Ensure these URIs are added:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
   - `https://[PROJECT-ID].supabase.co/auth/v1/callback` (Supabase)

### Error: "Invalid domain"

**Problem**: The email domain is not `@laverdad.edu.ph`, `@student.laverdad.edu.ph`, or `@ticket-team.laverdad.edu.ph`.

**Solution**: Only school emails are allowed. This is working as intended.

**Security Implementation**:
1. **Database Constraint**: `valid_email_domain` constraint prevents invalid domain users from being created in `public.users`
2. **Callback Validation**: Server-side validation in `src/app/auth/callback/route.ts` checks domain and cleans up invalid users
3. **Automatic Cleanup**: Invalid domain users are automatically removed from `public.users` and signed out

**To change allowed domains**: 
1. Update database constraint:
   ```sql
   ALTER TABLE public.users DROP CONSTRAINT valid_email_domain;
   ALTER TABLE public.users ADD CONSTRAINT valid_email_domain 
   CHECK (split_part(email, '@', 2) IN ('your-domain.com', 'another-domain.com'));
   ```
2. Update callback route:
   ```typescript
   const allowedDomains = ['your-domain.com', 'another-domain.com']
   ```

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not properly configured.

**Solution**:
1. Go to Google Cloud Console > OAuth consent screen
2. Ensure **User Type** is set to **Internal**
3. Complete all required fields
4. Publish the app

### User not created in database

**Problem**: The `handle_new_user` trigger might not be firing.

**Solution**:
1. Check Supabase logs: Dashboard > Database > Logs
2. Verify the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Re-run the migration if needed:
   ```bash
   npm run db:migrate
   ```

### Session not persisting

**Problem**: Middleware not refreshing session properly.

**Solution**:
1. Check `middleware.ts` is at project root
2. Verify `matcher` config includes all routes
3. Clear browser cookies and try again

---

## 📊 Database Schema

The authentication system uses these tables:

### `auth.users` (Supabase Auth)
- Managed by Supabase
- Stores authentication data
- Includes Google OAuth metadata in `raw_user_meta_data`

### `public.users` (Application)
- Your application's user table
- Synced via `handle_new_user()` trigger
- Includes profile data and role

**Relationship**: `public.users.id` → `auth.users.id` (foreign key)

---

## 🔐 Security Considerations

1. **Multi-Layer Domain Validation**: 
   - **Database Constraint**: `valid_email_domain` prevents invalid domain users from being created
   - **Server-Side Validation**: Callback route validates domains and cleans up invalid users
   - **Allowed Domains**: `@laverdad.edu.ph`, `@student.laverdad.edu.ph`, `@ticket-team.laverdad.edu.ph`
2. **Internal OAuth**: Set Google OAuth to "Internal" to restrict to your Workspace
3. **RLS Policies**: Database enforces access control automatically
4. **Session Refresh**: Middleware automatically refreshes expired sessions
5. **Deactivation**: Deactivated users are signed out at multiple layers
6. **Automatic Cleanup**: Invalid domain users are automatically removed from `public.users` table

---

## 📝 Testing Checklist

Before going live, verify:

- [x] Can sign in with `@laverdad.edu.ph` email
- [x] Can sign in with `@student.laverdad.edu.ph` email
- [x] Cannot sign in with non-school email
- [x] User profile populated with name and avatar
- [ ] Sign out works correctly
- [ ] Protected routes redirect to sign-in
- [ ] Admin routes require admin role
- [ ] Deactivated users cannot access system
- [ ] Session persists across page refreshes
- [ ] Production URLs work correctly

---

## 🆘 Getting Help

If you encounter issues:

1. Check Supabase logs: Dashboard > Authentication > Logs
2. Check Google Cloud logs: Cloud Console > Logging
3. Check browser console for JavaScript errors
4. Review middleware logs in terminal

For email domain issues:
- Verify `allowedDomains` in `src/app/auth/callback/route.ts`
- Check `hd` parameter in `src/app/actions/auth.ts`

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

---

## ✅ Implementation Complete

Your Google SSO authentication system is fully implemented. Just follow this guide to configure the OAuth credentials and you'll be ready to go!

**Next Steps**: Follow Steps 1-4 above to configure and test your authentication system.

