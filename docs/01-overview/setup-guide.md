# Setup Guide

> Instructions to install and configure the project locally.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Supabase Setup](#supabase-setup)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Vercel Deployment Setup](#vercel-deployment-setup)
- [Seeding and Migrations](#seeding-and-migrations)
- [References](#references)

## Prerequisites
- Node.js 18+ (LTS recommended)
- Git
- Package manager: npm or pnpm
- Supabase account and project
- Vercel account (for hosting)
- Gemini API key from Google AI Studio

```bash
node -v
npm -v
# or
pnpm -v
```

## Supabase Setup
1. Create a new Supabase project.
2. In the project settings, copy your Project URL and anon public key.
3. Ensure the `vector` extension is enabled (for pgvector):

```sql
-- SQL Editor in Supabase
create extension if not exists vector;
```

4. (Optional) Prepare tables, RLS policies, and migrations according to your schema. See [Database Schema](../02-architecture/database-schema.md).

## Environment Variables
Create a `.env.local` at the repo root for local development:

```bash
# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Server-only secrets (never expose to the browser)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Notes:
- `NEXT_PUBLIC_*` variables are readable on the client.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side (e.g., API Routes) and never shipped to the browser.
- `GEMINI_API_KEY` is used exclusively by serverless functions to call Gemini.

## Installation
```bash
# clone repository
git clone <REPO_URL>
cd ticket-team

# install dependencies
npm install
# or
pnpm install
```

## Running Locally
```bash
npm run dev
# or
pnpm dev
# App should be available at http://localhost:3000
```

Log in or sign up using the app’s authentication flow powered by Supabase Auth. Ensure RLS policies allow appropriate access for your role(s).

## Vercel Deployment Setup
1. Import the repository into Vercel.
2. Add the same environment variables in your Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
3. Trigger a deploy. Preview deployments inherit env vars from the project unless overridden.

## Seeding and Migrations
- If using the Supabase CLI, you can manage migrations locally and push them to your project.
- Keep RLS policies under version control and verify permissions in non-production environments before promoting.

## References
- See also: [Quick Start](./quick-start.md)
- See also: [System Architecture](../02-architecture/system-architecture.md)
- See also: [Database Schema](../02-architecture/database-schema.md)
