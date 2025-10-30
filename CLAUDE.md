# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ticket Team** is an AI-powered helpdesk platform for La Verdad Christian College built with a RAG (Retrieval-Augmented Generation) architecture. The system provides intelligent ticket management with semantic search, grounded AI responses, and role-based access control.

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript + React 19
- Supabase (PostgreSQL + Auth + Storage + pgvector)
- Gemini API (via @google/genai)
- Tailwind CSS v4 + shadcn/ui
- Sentry for error monitoring

## Essential Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run dev:clean        # Clean cache + start dev server
npm run dev:safe         # Clean cache + verify DB + start dev
npm run build            # Production build
npm run build:clean      # Clean cache + build
npm run start            # Start production server
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run health           # Check build health (cache integrity, manifests)
npm run check-db         # Verify Supabase connection
npm run clean:cache      # Clean webpack cache (fixes build issues)
```

### Testing
Tests are not yet implemented. When adding tests, follow patterns in `.cursor/rules/testing-quality.mdc`.

## Critical Architecture Patterns

### Supabase Client Initialization

**Three distinct clients based on context:**

```typescript
// 1. Server Components & Server Actions - uses cookies, respects RLS
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// 2. Client Components - browser client, respects RLS
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// 3. Service role (RARELY USED) - bypasses RLS, extremely sensitive
import { createServiceClient } from '@/lib/supabase/service'
const supabase = createServiceClient()
```

**NEVER expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` to the client.**

### RAG (Retrieval-Augmented Generation) Flow

All AI responses are grounded in the institutional knowledge base:

1. User query → Generate embedding (768-dim via Gemini text-embedding-004)
2. Semantic search using pgvector (`match_kb_articles` RPC function)
3. Retrieve top-K KB articles with similarity threshold (0.7)
4. Augment prompt with retrieved context
5. Generate response via Gemini API with institutional context
6. Return grounded response with source citations

**Key Implementation Files:**
- AI embedding generation: Check API routes in `src/app/api/`
- pgvector functions: `supabase/migrations/20250114000005_create_functions_triggers.sql`
- KB article schema: `supabase/migrations/20250114000002_create_core_tables.sql`

### Authentication & Authorization

**Domain Validation:**
- Only `@laverdad.edu.ph` and `@student.laverdad.edu.ph` emails allowed
- Validation happens in `app/auth/callback/route.ts` after OAuth
- Invalid domains are cleaned up (user deleted, session cleared)

**Role-Based Access Control (RBAC):**
```typescript
enum UserRole {
  employee     // Submit tickets, view own tickets
  staff        // Manage assigned tickets, create KB articles
  admin        // User management (except super_admins)
  super_admin  // Full access including feedback analytics
}
```

**Session Management:**
- Middleware (`middleware.ts`) refreshes auth cookies on every request
- Authenticated routes use `src/components/auth/auth-guard.tsx`

### Data Integrity Rules

**Immutable Entities (append-only, no UPDATE/DELETE):**
- `ticket_comments` - audit trail integrity
- `ticket_activities` - complete change history
- `ticket_feedback` - analytics integrity

**Soft Delete Pattern:**
```typescript
// Users: deactivated_at, deactivated_by
// Attachments: deleted_at, deleted_by
// Tickets: Use status transitions (never delete)
// KB articles: status='archived' (never delete)
```

**Required Audit Fields:**
```typescript
{
  created_at: timestamptz    // Always required
  created_by?: uuid          // Required for user actions
  updated_at?: timestamptz   // For mutable entities
  updated_by?: uuid          // For mutable entities
}
```

### Component Architecture

**Default to Server Components:**
```tsx
// ✅ Server Component (default) - async, direct DB queries
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('tickets').select('id, title')
  return <TicketList tickets={data} />
}

// ⚠️ Only use 'use client' when necessary (interactivity, hooks)
'use client'
export function InteractiveForm() {
  const [state, setState] = useState()
  // ...
}
```

**Server Actions (preferred for mutations):**
```tsx
// app/actions/tickets.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase.from('tickets').insert({
    title: formData.get('title'),
    user_id: user?.id,
    status: 'open',
    created_by: user?.id
  })

  if (error) return { error: error.message }
  return { success: true, data }
}
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Route group with auth guard + shared layout
│   │   ├── dashboard/        # Main dashboard page
│   │   └── profile/          # User profile management
│   ├── actions/              # Server Actions (auth.ts, profile.ts)
│   ├── api/                  # API Routes (AI proxy endpoints)
│   ├── auth/                 # Auth routes (callback, sign-in, error)
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles + Tailwind directives
├── components/
│   ├── ui/                   # shadcn/ui primitives (button, dialog, etc.)
│   ├── auth/                 # auth-guard.tsx, google-sign-in-button.tsx
│   ├── dashboard/            # Dashboard-specific components
│   └── shared/               # navbar.tsx, footer.tsx, sidebar.tsx
├── lib/
│   ├── supabase/             # server.ts, client.ts, service.ts, middleware.ts
│   ├── types/                # TypeScript types matching DB schema
│   ├── validations/          # Zod schemas for input validation
│   ├── dashboard/            # Dashboard data fetching (queries.ts)
│   ├── hooks/                # React hooks (use-user.ts, use-dashboard.ts)
│   ├── constants/            # App constants (activity-types.ts, pagination.ts)
│   └── utils.ts              # Utility functions (cn, formatters)
└── instrumentation.ts        # Sentry initialization

supabase/migrations/          # Sequential SQL migrations (never modify existing)
scripts/                      # Build health checks, DB verification
docs/                         # Comprehensive documentation
.cursor/rules/                # AI-assisted development guidelines
```

**Import Alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`)

## Database Architecture

**Key Tables:**
- `users` - User profiles with RBAC (extends Supabase auth.users)
- `tickets` - Support tickets with full lifecycle tracking
- `ticket_comments` - Immutable comment thread
- `ticket_activities` - Immutable audit log
- `ticket_feedback` - Post-resolution satisfaction surveys
- `knowledge_articles` - KB articles with pgvector embeddings (768-dim)
- `ai_interactions` - Conversation tracking for RAG sessions

**Important Indexes:**
- `idx_tickets_status`, `idx_tickets_priority` - Fast filtering
- `idx_tickets_assigned_status` - Staff dashboard queries
- `idx_knowledge_articles_embedding` - HNSW for vector similarity
- `idx_ai_interactions_session_id` - Session tracking

**RLS (Row Level Security):**
All tables have RLS enabled. Policies enforce role-based access:
- Employees see only their own tickets
- Staff see assigned tickets
- Admins see all tickets (except feedback from super_admins)
- Super_admins have full access

See: `supabase/migrations/20250114000004_create_rls_policies.sql`

## Performance & Optimization

### Webpack Cache Management

**Cache Issues:**
The project uses a custom webpack cache configuration with filesystem caching and proper locking to prevent race conditions. If you encounter build errors:

```bash
npm run clean:cache     # Clean webpack cache
npm run health          # Verify build integrity
npm run dev:safe        # Clean + verify DB + dev
```

**Build Health Checks:**
`scripts/check-build-health.ts` validates:
- Manifest files existence and validity
- Webpack cache size and age
- Orphaned chunk detection
- Module resolution integrity

### Database Query Optimization

```typescript
// ✅ Always select specific columns, paginate, use indexes
const { data } = await supabase
  .from('tickets')
  .select('id, title, status, created_at')
  .eq('status', 'open')           // Uses idx_tickets_status
  .order('created_at', { ascending: false })
  .range(0, 19)                   // Pagination (20 per page)

// ❌ Avoid SELECT * without pagination
```

**Key Indexes Available:**
- Status filtering: `idx_tickets_status`
- Priority filtering: `idx_tickets_priority`
- User tickets: `idx_tickets_user_id`
- Staff assignments: `idx_tickets_assigned_status` (composite)
- Vector search: `idx_knowledge_articles_embedding` (HNSW)

### Component Performance

```tsx
// Use useMemo for expensive computations
const filtered = useMemo(() =>
  tickets.filter(t => t.status === 'open'),
  [tickets]
)

// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />
})
```

## Security Guidelines

**Environment Variables (never commit):**
```bash
NEXT_PUBLIC_SUPABASE_URL=         # Safe for client
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Safe for client
SUPABASE_SERVICE_ROLE_KEY=        # SERVER-ONLY, bypasses RLS
GEMINI_API_KEY=                   # SERVER-ONLY
```

**Security Principles:**
1. Keep service role key and API keys server-only
2. Proxy all AI requests through Next.js API Routes
3. Enforce RLS on all tables
4. Validate all user input server-side with Zod schemas
5. Use least-privilege principle for role permissions
6. Never log sensitive information (tokens, API keys, PII)
7. Maintain immutable audit trails for compliance

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Build errors with "Cannot find module" | Corrupted webpack cache | `npm run clean:cache` then `npm run dev` |
| "Unauthorized" errors | RLS policy blocking | Check user role, verify policy in migrations |
| Slow queries | Missing index or no pagination | Add index for WHERE clause, use `.range()` |
| Client re-renders | Missing memoization | Use `useMemo`, `useCallback`, `React.memo` |
| Type errors | Wrong import path | Use `@/` alias, match exact paths |
| AI wrong response | Poor retrieval | Tune similarity threshold (0.7 default), improve KB content |
| Development server crashes | File system race condition | Use `npm run dev:safe` (cleans cache + verifies DB) |

## Development Workflow

**Git Workflow:**
- Trunk-based development with `main` as production branch
- Short-lived feature branches from `development`
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
- Never modify existing database migrations (create new ones)

**Before Committing:**
- Run `npm run lint` - fix any ESLint errors
- Ensure TypeScript compiles with no type errors
- Remove any console.logs or debugging code
- Verify audit fields are present for user actions
- Check that security best practices are followed

**Environment-Specific Behavior:**
- Development: Webpack cache with proper locking, hot reloading
- Production: Optimized bundles, code splitting, deterministic chunk IDs
- Sentry monitoring disabled in development, enabled in production

## Key Documentation References

**Comprehensive Docs (`docs/`):**
- `docs/02-architecture/system-architecture.md` - Full system design, RLS examples, data flow
- `docs/02-architecture/database-schema.md` - ERD, data dictionary, all constraints
- `docs/adr/0004-RAG-architecture.md` - Why RAG pattern over pure LLM
- `docs/06-development/coding-standards.md` - Naming conventions, error handling, security

**Cursor Rules (`.cursor/rules/`):**
- `QUICK-REFERENCE.md` - Scenario-based cookbook with code examples
- `supabase-integration.mdc` - Client patterns, RLS, error handling
- `ai-rag-patterns.mdc` - Complete RAG flow, embeddings, streaming
- `component-patterns.mdc` - Server vs client components, forms, shadcn/ui
- `security-auth.mdc` - Auth flows, RBAC, secrets management
- `data-integrity.mdc` - Immutability rules, soft deletes, audit trails

**GitHub Copilot Instructions:**
`.github/copilot-instructions.md` contains critical patterns and architecture notes (similar to this file but more detailed).

## AI Integration Specifics

**Use New Google GenAI SDK:**
```typescript
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Generate embeddings (768-dim)
const result = await ai.models.embedContent({
  model: 'text-embedding-004',
  contents: userQuery
})
const embedding = result.embeddings[0].values

// Semantic search
const { data } = await supabase.rpc('match_kb_articles', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 5
})

// Generate grounded response
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: `Context:\n${kbContext}\n\nQuestion: ${userQuery}`,
  config: {
    systemInstruction: 'You are IT support for LVCC. Use KB context. Cite sources.',
    temperature: 0.7
  }
})
```

**Critical:** All AI operations must happen server-side. Proxy through API Routes.

## Deployment

**Platform:** Vercel
- `main` branch auto-deploys to production
- Preview deployments for all PRs
- Environment variables configured in Vercel dashboard

**Pre-deployment Checklist:**
- All tests pass (when implemented)
- Database migrations applied to production Supabase
- Environment variables configured in Vercel
- RLS policies tested thoroughly
- Build health check passes (`npm run health`)

---

**For detailed implementation patterns and examples, always refer to `.cursor/rules/QUICK-REFERENCE.md` and the comprehensive documentation in `docs/`.**
