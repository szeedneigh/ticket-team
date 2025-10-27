# Quick Reference Guide

## Common Scenarios & Relevant Rules

### 🎯 I'm working on...

#### Authentication & User Management
**Rules to check:**
- [`security-auth.mdc`](./security-auth.mdc) - Auth flows, RBAC, session management
- [`supabase-integration.mdc`](./supabase-integration.mdc) - Supabase Auth client setup
- [`data-integrity.mdc`](./data-integrity.mdc) - User soft delete, deactivation

**Key patterns:**
```ts
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Check user role
const user = await getCurrentUser()
if (!['admin', 'super_admin'].includes(user.role)) {
  throw new Error('Unauthorized')
}
```

---

#### Creating/Managing Tickets
**Rules to check:**
- [`data-integrity.mdc`](./data-integrity.mdc) - Ticket lifecycle, immutability
- [`supabase-integration.mdc`](./supabase-integration.mdc) - Database queries, RLS
- [`component-patterns.mdc`](./component-patterns.mdc) - Forms, Server Actions

**Key patterns:**
```ts
// Create ticket with audit trail
const { data, error } = await supabase
  .from('tickets')
  .insert({
    title,
    description,
    status: 'open',
    created_by: user.id
  })
```

---

#### AI Chatbot & RAG
**Rules to check:**
- [`ai-rag-patterns.mdc`](./ai-rag-patterns.mdc) - RAG flow, embeddings, Gemini API
- [`performance-optimization.mdc`](./performance-optimization.mdc) - Streaming, caching
- [`security-auth.mdc`](./security-auth.mdc) - API key protection

**Key patterns:**
```ts
// RAG retrieval
const embedding = await generateEmbedding(userQuery)
const { data } = await supabase.rpc('match_kb_articles', {
  query_embedding: embedding,
  match_count: 5
})

// Stream AI response
const result = await model.generateContentStream(prompt)
```

---

#### Building UI Components
**Rules to check:**
- [`component-patterns.mdc`](./component-patterns.mdc) - Component structure, shadcn/ui
- [`tailwind-v4.mdc`](./tailwind-v4.mdc) - Styling with Tailwind
- [`typescript-imports.mdc`](./typescript-imports.mdc) - Import conventions
- [`performance-optimization.mdc`](./performance-optimization.mdc) - Memoization, lazy loading

**Key patterns:**
```tsx
// Server Component (default)
export default async function Page() {
  const data = await fetchData()
  return <Display data={data} />
}

// Client Component (when needed)
'use client'
export function InteractiveForm() {
  const [state, setState] = useState()
  // ...
}
```

---

#### Database Schema & Migrations
**Rules to check:**
- [`supabase-integration.mdc`](./supabase-integration.mdc) - Schema conventions
- [`data-integrity.mdc`](./data-integrity.mdc) - Audit fields, soft deletes
- [`performance-optimization.mdc`](./performance-optimization.mdc) - Indexing

**Key patterns:**
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id)
);

-- Add index for common queries
CREATE INDEX idx_tickets_status ON tickets(status);
```

---

#### Writing Tests
**Rules to check:**
- [`testing-quality.mdc`](./testing-quality.mdc) - Test strategies, examples

**Key patterns:**
```tsx
// Component test
import { render, screen } from '@testing-library/react'
test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})

// E2E test
test('user can create ticket', async ({ page }) => {
  await page.goto('/tickets/new')
  await page.fill('[name="title"]', 'Test')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/tickets\/\w+/)
})
```

---

#### Optimizing Performance
**Rules to check:**
- [`performance-optimization.mdc`](./performance-optimization.mdc) - All optimization patterns
- [`component-patterns.mdc`](./component-patterns.mdc) - Memoization, lazy loading

**Key patterns:**
```tsx
// Memoize expensive computation
const filtered = useMemo(() => 
  tickets.filter(t => t.status === 'open'), 
  [tickets]
)

// Code splitting
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />
})
```

---

## 🔍 By Technology/Feature

| Technology | Primary Rule | Related Rules |
|------------|-------------|---------------|
| **Next.js** | `next-app-router.mdc` | `project-structure.mdc`, `component-patterns.mdc` |
| **Supabase** | `supabase-integration.mdc` | `security-auth.mdc`, `data-integrity.mdc` |
| **AI/RAG** | `ai-rag-patterns.mdc` | `performance-optimization.mdc`, `security-auth.mdc` |
| **TypeScript** | `typescript-imports.mdc` | `eslint-quality.mdc` |
| **Tailwind** | `tailwind-v4.mdc` | `component-patterns.mdc` |
| **Security** | `security-auth.mdc` | `data-integrity.mdc`, `docs-security-integrity.mdc` |
| **Testing** | `testing-quality.mdc` | `component-patterns.mdc` |

---

## 🚨 Critical Constraints (Never Violate)

### Security
✅ **DO:**
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` server-only
- Enforce RLS on all tables
- Validate all user input server-side
- Use least-privilege principle

❌ **DON'T:**
- Expose API keys to client
- Bypass RLS in client code
- Trust client-side validation alone
- Log sensitive information

### Data Integrity
✅ **DO:**
- Use soft delete for users, attachments, domain records
- Make comments and history immutable
- Track changes with `created_by`, `updated_at`, etc.
- Maintain referential integrity

❌ **DON'T:**
- Hard delete tickets, users, or feedback
- Allow UPDATE/DELETE on comments
- Skip audit fields

### Performance
✅ **DO:**
- Paginate large datasets
- Index frequently queried columns
- Cache embeddings and KB articles
- Use server components by default

❌ **DON'T:**
- Fetch all rows without pagination
- Make N+1 queries
- Add `"use client"` unnecessarily
- Perform heavy computation in render

---

## 📋 Checklists

### Before Committing
- [ ] Run `npm run lint` - no errors
- [ ] TypeScript compiles - no type errors
- [ ] Tests pass - `npm run test`
- [ ] No console.logs in production code
- [ ] Security: No exposed secrets
- [ ] Data integrity: Audit fields present
- [ ] Performance: Queries optimized

### Before Deploying
- [ ] All tests pass (unit, integration, E2E)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] RLS policies tested
- [ ] Performance budget met (Lighthouse score)
- [ ] Security headers configured
- [ ] Error monitoring enabled

### Code Review Focus
- [ ] Security: Auth/authz correct, no leaks
- [ ] Data integrity: Immutability enforced
- [ ] Performance: Proper caching, indexing
- [ ] Testing: Critical paths covered
- [ ] Accessibility: ARIA, keyboard nav
- [ ] Error handling: User-friendly messages

---

## 🆘 Troubleshooting

| Problem | Check This Rule | Common Fix |
|---------|-----------------|------------|
| "Unauthorized" errors | `security-auth.mdc` | Verify RLS policies and user role |
| Slow queries | `performance-optimization.mdc` | Add indexes, paginate results |
| AI responses wrong | `ai-rag-patterns.mdc` | Improve retrieval, tune embeddings |
| Component re-renders | `component-patterns.mdc` | Use memoization, check deps |
| TypeScript errors | `typescript-imports.mdc` | Fix path aliases, types |
| Build fails | `eslint-quality.mdc` | Run linter, fix import order |

---

## 📚 Learning Path

### New to the Project?
1. Read [`project-structure.mdc`](./project-structure.mdc)
2. Review [`docs/01-overview/quick-start.md`](../docs/01-overview/quick-start.md)
3. Understand ADRs in `docs/adr/`
4. Explore [`component-patterns.mdc`](./component-patterns.mdc)

### Want to Contribute?
1. Read [`docs/06-development/coding-standards.md`](../docs/06-development/coding-standards.md)
2. Check [`docs/06-development/git-workflow.md`](../docs/06-development/git-workflow.md)
3. Review [`testing-quality.mdc`](./testing-quality.mdc)
4. Follow [`eslint-quality.mdc`](./eslint-quality.mdc)

### Deep Dives
- **Backend**: `supabase-integration.mdc` + `docs/02-architecture/database-schema.md`
- **AI Features**: `ai-rag-patterns.mdc` + `docs/adr/0004-RAG-architecture.md`
- **Security**: `security-auth.mdc` + `docs/02-architecture/system-architecture.md`
- **Performance**: `performance-optimization.mdc` + Core Web Vitals monitoring

---

**Last updated**: 2025-10-13

