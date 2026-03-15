# Ticket Team - Project Context for Gemini

## Project Overview

**Ticket Team** is an AI-powered helpdesk platform built for La Verdad Christian College. It leverages a RAG (Retrieval-Augmented Generation) architecture to provide intelligent ticket management, semantic search, and automated support.

### Key Features
- **Ticket Management:** Complete lifecycle tracking, role-based workflows, file attachments.
- **Knowledge Base:** Semantic search using `pgvector`, rich text editing (Tiptap), voting system.
- **AI Support:** RAG-based chatbot (Gemini API) grounded in KB articles.
- **Auth & Security:** Google OAuth (Supabase), RBAC (Employee, Staff, Admin, Super Admin), Row Level Security (RLS).

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5.9
- **Styling:** Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **AI:** Google Gemini API (`@google/genai`), `pgvector` for embeddings
- **Testing:** Playwright (E2E), Vitest (Unit)
- **Monitoring:** Sentry, Vercel Analytics

## Development Workflow

### Essential Commands
- **Start Dev Server:** `npm run dev`
- **Safe Dev Start:** `npm run dev:safe` (Cleans cache + verifies DB - Recommended if issues arise)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Type Check:** `npx tsc --noEmit`
- **Run E2E Tests:** `npm run test:e2e`
- **Run Unit Tests:** `npm run test:unit`
- **Security Check:** `npm run check-bundle-security`

### Architecture Standards

#### 1. Environment Variables (Security Critical)
This project uses a **split environment variable architecture**.
- **Client-side:** Import from `@/lib/env/client`. ONLY safe public vars.
- **Server-side:** Import from `@/lib/env/server` AND `@/lib/env/client`. Contains secrets (Service Role Key, Gemini Key).
- **Forbidden:** Importing `@/lib/env/server` in client components throws a runtime error.
- **Legacy:** Do NOT use `@/lib/env`. It is deprecated.

#### 2. Supabase Clients
- **Server Components/Actions:** `import { createClient } from '@/lib/supabase/server'` (Uses cookies, respects RLS)
- **Client Components:** `import { createClient } from '@/lib/supabase/client'` (Browser client, respects RLS)
- **Service Role:** `import { createServiceClient } from '@/lib/supabase/service'` (Bypasses RLS - Use with extreme caution, server-side ONLY)

#### 3. Component Pattern
- **Server Components:** Default. Fetch data here.
- **Client Components:** Use `'use client'` at the top. Keep them leaf nodes where possible.
- **Boundary:** Do NOT pass functions as props from Server to Client components. Pass serializable data only.

#### 4. Database & RLS
- **RLS:** Enabled on ALL tables.
- **Migrations:** stored in `supabase/migrations`. Never edit applied migrations; create new ones.
- **Types:** Generated/maintained in `src/lib/types`.

### AI & RAG Implementation
- **Embeddings:** Generated via Gemini `text-embedding-004` (768 dimensions).
- **Search:** Uses `pgvector` with HNSW index via `match_kb_articles` RPC function.
- **Chat:** Proxy all Gemini API calls through Next.js API routes (`src/app/api/`). Never expose the API key to the client.

## Directory Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: UI components (shadcn/ui in `ui/`, feature-specific in `dashboard/`, `ticket/`, etc.).
- `src/lib`: Utilities, hooks, types, Supabase clients, Zod schemas.
- `supabase/migrations`: SQL migration files.
- `tests`: Playwright E2E tests.
- `docs`: Comprehensive project documentation.

## Current Status (Nov 2025)
- **Complete:** Auth, Ticket Management, Knowledge Base (including semantic search).
- **In Progress:** AI/RAG Chat Interface (Backend ready, UI pending), Analytics Dashboard, User Management.
