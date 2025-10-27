# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================

# Public Supabase URL (safe to expose to client)
NEXT_PUBLIC_SUPABASE_URL=https://nytvyigrpxcqcyqbulww.supabase.co

# Public Anonymous Key (safe to expose to client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dHZ5aWdycHhjcWN5cWJ1bHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTAwNTAsImV4cCI6MjA3Mzc4NjA1MH0.ZHLi-zBLxzlzcjCvn5E9joRtVC9h7GFhz3LjDR_d1ak

# Service Role Key (KEEP SECRET! Server-side only)
# Get from: Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================================================
# GEMINI API CONFIGURATION
# ============================================================================

# Gemini API Key for AI features
# Get from: https://ai.google.dev/
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## How to Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/nytvyigrpxcqcyqbulww
2. Navigate to: **Settings** > **API**
3. Scroll down to **Project API keys**
4. Copy the `service_role` key (it's a long JWT token)
5. Paste it into your `.env.local` file

⚠️ **IMPORTANT:** Never commit the service role key to version control!

---

## How to Get Your Gemini API Key

1. Go to: https://ai.google.dev/
2. Click **Get API Key** or **Get Started**
3. Sign in with your Google account
4. Create a new API key in Google AI Studio
5. Copy the API key
6. Paste it into your `.env.local` file

---

## Security Notes

### ✅ Safe to Expose (Client-side)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are prefixed with `NEXT_PUBLIC_` and are safe to expose to the browser. They're protected by Row Level Security (RLS) policies in the database.

### 🔒 KEEP SECRET (Server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, has full database access
- `GEMINI_API_KEY` - Your AI API key with usage limits

**Never:**
- Commit these to Git
- Share them publicly
- Use them in client-side code
- Expose them in browser console

---

## Verify Setup

After creating `.env.local`, verify it's working:

```bash
# Start development server
npm run dev

# Check if environment variables are loaded
# Open browser console and check for Supabase client initialization
```

If you see errors about missing environment variables, make sure:
1. The file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
2. The file is in the project root directory
3. You've restarted the development server after creating the file

---

## .gitignore

The `.env.local` file is already in `.gitignore` and will not be committed to version control. This is intentional for security.

---

## Example .env.example

A template file `.env.example` should exist in the project root for reference:

```bash
# Supabase Configuration (Client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (Server-side only - KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

Copy this to `.env.local` and fill in your actual values.

