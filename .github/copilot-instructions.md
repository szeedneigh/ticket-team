# Ticket-Team Copilot Instructions

AI-powered helpdesk for La Verdad Christian College built with RAG architecture.

## Stack & Architecture

**Core**: Next.js 15 App Router + TypeScript + Supabase (PostgreSQL + Auth + Storage) + Gemini API + Tailwind v4 + shadcn/ui

**RAG Flow**: User query → Vector search (pgvector 768-dim) → Top-K KB articles → Augmented prompt → Gemini → Grounded response

**Key Principle**: Grounded AI responses via Retrieval-Augmented Generation to prevent hallucinations. All AI responses cite institutional knowledge base articles stored with embeddings in PostgreSQL.

## Critical Patterns

### Supabase Client Initialization

```typescript
// Server Components & Server Actions - use cookies, respects RLS
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client Components - browser client, still respects RLS  
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Admin operations (API Routes ONLY) - bypasses RLS, never expose to client
import { createClient } from '@/lib/supabase/admin'
const supabase = createClient()
```

### Authentication Flow

**Domain Validation**: Only `@laverdad.edu.ph` and `@student.laverdad.edu.ph` emails allowed. Validation happens in `app/auth/callback/route.ts` after OAuth exchange - invalid domains are cleaned up (delete from `users` table, sign out).

**Session Management**: Middleware (`middleware.ts`) calls `updateSession()` on every request to refresh auth cookies. Middleware matcher excludes static assets.

**RBAC via Enum**:
- `employee`: Submit tickets, view own tickets  
- `staff`: Manage assigned tickets, create KB articles
- `admin`: User management (cannot touch super_admins)
- `super_admin`: Full access including feedback analytics

### Data Integrity Rules

**Immutable Entities** (no UPDATE/DELETE):
- `ticket_comments` - append-only audit trail
- `ticket_activities` - complete change history
- `ticket_feedback` - analytics integrity

**Soft Delete Pattern**:
```typescript
// Users
{ deactivated_at: timestamptz, deactivated_by: uuid }

// Attachments  
{ deleted_at: timestamptz, deleted_by: uuid }

// Never hard delete: tickets (use status transitions), KB articles (status='archived')
```

**Always Include Audit Fields**:
```typescript
{ 
  created_at: timestamptz,
  created_by?: uuid,
  updated_at?: timestamptz, 
  updated_by?: uuid
}
```

### Component Architecture

**Default to Server Components**:
```tsx
// ✅ Server Component (default) - async, direct DB queries
export default async function TicketsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('tickets').select('id, title, status')
  return <TicketList tickets={data} />
}

// ⚠️ Only add 'use client' when NECESSARY
'use client'
export function TicketForm() {
  const [title, setTitle] = useState('') // Needs interactivity
  // ...
}
```

**Server Actions** (preferred for mutations):
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
    status: 'open'
  })
  
  if (error) return { error: error.message }
  return { success: true, data }
}
```

### AI/RAG Implementation

**Use New Google GenAI SDK** (`@google/genai` not `@google/generative-ai`):
```typescript
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Generate embeddings (768-dim text-embedding-004)
const result = await ai.models.embedContent({
  model: 'text-embedding-004',
  contents: userQuery
})
const embedding = result.embeddings[0].values

// Semantic search with pgvector
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

**Critical**: Keep `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. Proxy all AI requests through Next.js API Routes.

### Database Query Patterns

```typescript
// ✅ Always select specific columns, paginate, index WHERE clauses
const { data } = await supabase
  .from('tickets')
  .select('id, title, status, created_at')
  .eq('status', 'open')
  .order('created_at', { ascending: false })
  .range(0, 19) // Pagination

// ✅ Use existing indexes (see migrations/20250114000003_create_indexes.sql)
// idx_tickets_status, idx_tickets_assigned_status, idx_knowledge_articles_embedding

// ❌ Avoid SELECT * without pagination
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # Route group with shared layout
│   │   ├── dashboard/      # Main dashboard
│   │   └── profile/        # User profile
│   ├── actions/            # Server Actions (auth.ts, profile.ts)
│   ├── auth/               # Auth routes (callback, sign-in, error)
│   └── api/                # API Routes (AI proxy)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── auth/               # auth-guard.tsx, google-sign-in-button.tsx
│   ├── dashboard/          # Dashboard components
│   └── shared/             # navbar.tsx, footer.tsx, sidebar.tsx
└── lib/
    ├── supabase/           # server.ts, client.ts, admin.ts, middleware.ts
    ├── types/              # TypeScript types matching DB schema
    └── validations/        # Zod schemas

supabase/migrations/        # Sequential SQL migrations (never modify existing)
```

**Import Alias**: `@/*` maps to `src/*` (tsconfig.json)

## Database Schema Highlights

**ENUMs**: `user_role`, `ticket_status`, `ticket_priority`, `article_status` (see `migrations/20250114000001`)

**Key Indexes**:
- `idx_tickets_status`, `idx_tickets_priority`, `idx_tickets_user_id`
- `idx_tickets_assigned_status` (composite for staff dashboard)
- `idx_knowledge_articles_embedding` (HNSW for vector similarity)
- `idx_ai_interactions_session_id` (conversation tracking)

**RLS Policies**: Enforced on all tables. Examples in `migrations/20250114000004_create_rls_policies.sql` and `docs/02-architecture/system-architecture.md`.

## Development Workflow

```bash
npm run dev          # http://localhost:3000
npm run build        # Production build (CI requirement)
npm run lint         # ESLint check
npm run check-db     # Verify Supabase connection
```

**Git**: Conventional Commits (`feat:`, `fix:`, `chore:`), trunk-based with short-lived feature branches

**Deployment**: Vercel auto-deploys `main` branch. Preview deployments per PR.

**Environment Variables** (never commit):
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Server-only
GEMINI_API_KEY=                # Server-only
```

## Common Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unauthorized" error | RLS policy blocking | Check user role, verify policy in migrations |
| Slow queries | Missing index | See `migrations/20250114000003`, add index for WHERE clause |
| Client re-renders | Missing memoization | Use `useMemo`, `useCallback`, `React.memo` |
| Build fails | Import order | Run `npm run lint`, fix ESLint errors |
| Type errors | Wrong import path | Use `@/` alias, match exact paths |
| AI wrong response | Poor retrieval | Tune similarity threshold, improve KB content |

## Key References

**Architecture**:
- `docs/02-architecture/system-architecture.md` - Full design, RLS examples, data flow diagrams
- `docs/02-architecture/database-schema.md` - ERD, data dictionary, all indexes
- `docs/adr/0004-RAG-architecture.md` - Why RAG pattern over pure LLM

**Detailed Patterns** (`.cursor/rules/`):
- `QUICK-REFERENCE.md` - Scenario-based cookbook with code examples
- `supabase-integration.mdc` - Client patterns, RLS, error handling
- `ai-rag-patterns.mdc` - Complete RAG flow, embeddings, streaming, error handling
- `component-patterns.mdc` - Server vs client components, forms, shadcn/ui
- `security-auth.mdc` - Auth flows, RBAC, secrets management

**Development**:
- `docs/06-development/coding-standards.md` - Naming, error handling, security rules
- `docs/06-development/git-workflow.md` - Branching, commits, releases
- `docs/06-development/deployment.md` - Vercel setup, env vars, rollback

---

**Security First**: RLS on all tables. Server-only secrets. Immutable audit trails. Soft deletes only.
