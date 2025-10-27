<!-- 079d73a6-b07e-4c4f-a770-28be7c707b2b a5398a5d-1caf-4856-b780-43b53951ecc6 -->
# Ticket Team Implementation Plan

## Phase 1: Database Foundation (Priority)

### 1.1 Supabase Project Setup

- Create new Supabase project via MCP (`create_branch` or direct setup)
- Enable `pgvector` extension for semantic search
- Verify extension installation with `list_extensions`
- Configure project settings (timezone, connection pooling)

### 1.2 Database Schema - Custom Types

**Migration**: `20250114_001_create_custom_types.sql`

- Create PostgreSQL ENUM types:
  - `user_role`: `employee`, `staff`, `admin`, `super_admin`
  - `ticket_status`: `open`, `in_progress`, `on_hold`, `resolved`, `closed`, `canceled`
  - `ticket_priority`: `low`, `medium`, `high`
  - `article_status`: `draft`, `published`, `archived`

### 1.3 Database Schema - Core Tables

**Migration**: `20250114_002_create_core_tables.sql`

- Create tables in dependency order:

  1. `users` (base entity, links to auth.users)
  2. `categories` (self-referential for hierarchy)
  3. `tickets` (references users, denormalized category fields)
  4. `ticket_comments` (references tickets, users)
  5. `ticket_activities` (audit trail for tickets)
  6. `ticket_feedback` (references tickets, users, unique constraint)
  7. `knowledge_articles` (references users, tickets, includes vector(1536))
  8. `article_votes` (references articles, users, unique constraint)
  9. `ai_interactions` (references users, tickets, tracks RAG sessions)
  10. `attachments` (references tickets, comments, users, soft-delete fields)

**Key constraints per schema**:

- Foreign keys with proper ON DELETE behavior
- Check constraints (length validations, rating ranges 1-5)
- Unique constraints (emails, composite keys for feedback/votes)
- NOT NULL enforcement per data dictionary

### 1.4 Performance Optimization - Indexes

**Migration**: `20250114_003_create_indexes.sql`

**Critical indexes first** (immediate query performance):

```sql
-- Ticket querying (most frequent)
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_assigned_status ON tickets(assigned_to, status) 
  WHERE assigned_to IS NOT NULL;

-- Vector search (HNSW for optimal performance)
CREATE INDEX idx_knowledge_articles_embedding ON knowledge_articles 
  USING hnsw (embedding vector_cosine_ops);
```

**Secondary indexes** (analytical queries):

- Ticket priority, created_at, status combinations
- Knowledge articles: status, category, published_at
- AI interactions: user_id, session_id, escalated flag
- Comments/activities: ticket_id, created_at
- Foreign key indexes for JOIN optimization

**Optional full-text search** (GIN indexes for keyword search):

- Tickets: title + description
- KB articles: title + content

### 1.5 Security - Row Level Security Policies

**Migration**: `20250114_004_create_rls_policies.sql`

Enable RLS and create policies per table following the documented RLS section in `docs/02-architecture/system-architecture.md`:

**Users**: Read self + admin visibility, insert/update role-based

**Tickets**: Read (submitter or staff), Insert (self), Update (staff only)

**Comments**: Visible when parent ticket visible, author must match auth.uid()

**KB Articles**: Public read, staff/admin write

**Categories**: Public read, staff write

**Feedback**: Insert by submitter only, read by super_admin only

**Attachments**: Visible when parent ticket visible

**Note**: Use `auth.uid()` and check `users.role` field directly (no separate user_roles table per schema note in line 177 of system-architecture.md).

### 1.6 Database Functions & Triggers

**Migration**: `20250114_005_create_functions_triggers.sql`

**Triggers**:

- `update_updated_at_column()`: Auto-update timestamps on tickets, comments, articles
- `log_ticket_activity()`: Auto-create activity records on ticket changes
- `update_article_vote_counts()`: Sync votes to article aggregates

**RPC Functions**:

```sql
-- Soft delete attachment (staff only)
CREATE FUNCTION attachments_soft_delete(p_attachment_id uuid)

-- Deactivate user (admin/super_admin with guardrails)
CREATE FUNCTION deactivate_user(p_user_id uuid)

-- Helper: get_user_role(user_id) for cleaner policies
CREATE FUNCTION get_user_role(user_id uuid) RETURNS user_role
```

### 1.7 Seed Data

**Migration**: `20250114_006_seed_initial_data.sql`

**Categories** (ticket + KB taxonomy):

```sql
-- Hardware: Desktop, Laptop, Printer, Projector, Network Equipment
-- Software: Email, Office, Antivirus, System
-- Network: Internet, WiFi, VPN, File Sharing
-- Access: Account, Password Reset, Permissions
-- Other: Consultation, Training
```

**Initial Super Admin**:

```sql
-- Create super_admin user (email from environment or placeholder)
-- Link to auth.users.id after Supabase Auth setup
INSERT INTO users (id, email, full_name, role, department, position)
VALUES (
  '<UUID_PLACEHOLDER>', -- Replace with actual auth.users.id
  'admin@laverdad.edu.ph',
  'System Administrator',
  'super_admin',
  'MIS',
  'System Administrator'
);
```

## Phase 2: Supabase Integration Layer

### 2.1 Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D @supabase/supabase-js
```

### 2.2 Environment Configuration

Create `.env.local` with Supabase credentials from project dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

### 2.3 Supabase Client Utilities

Files to create in `src/lib/supabase/`:

**`client.ts`**: Browser client (uses anon key + RLS)

```typescript
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () => createBrowserClient(...)
```

**`server.ts`**: Server Component client (cookies-based auth)

```typescript
import { createServerClient } from '@supabase/ssr'
// Read-only cookie access for Server Components
```

**`service.ts`**: Service role client (bypasses RLS, server-only)

```typescript
import { createClient } from '@supabase/supabase-js'
// Uses SUPABASE_SERVICE_ROLE_KEY for admin operations
```

**`middleware.ts`**: Auth middleware for protected routes

### 2.4 TypeScript Types Generation

```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase/database.types.ts
```

Create domain types in `src/lib/types/`:

- `database.ts`: Re-export Supabase types with aliases
- `tickets.ts`: Ticket domain types and enums
- `users.ts`: User profiles and roles
- `knowledge-base.ts`: KB articles and search
- `api.ts`: API request/response types

## Phase 3: Core Infrastructure

### 3.1 Authentication Setup

- `src/app/auth/callback/route.ts`: OAuth callback handler
- `src/app/auth/sign-in/page.tsx`: Login page
- `src/app/auth/sign-out/route.ts`: Logout handler
- `src/lib/auth/`: Auth helpers and guards

### 3.2 API Routes Foundation

Structure under `src/app/api/v1/`:

- `tickets/route.ts`: List, create tickets
- `tickets/[id]/route.ts`: Get, update, delete ticket
- `tickets/[id]/comments/route.ts`: Comments CRUD
- `kb/articles/route.ts`: KB CRUD
- `search/route.ts`: RAG semantic search (Gemini proxy)
- `analytics/route.ts`: Dashboard KPIs

### 3.3 Utility Libraries

`src/lib/`:

- `utils.ts`: General helpers (cn(), formatDate(), etc.)
- `validations.ts`: Zod schemas for form validation
- `constants.ts`: App constants (roles, statuses, limits)
- `errors.ts`: Error handling utilities

## Phase 4: UI Foundation & Components

### 4.1 Layout & Providers

- Update `src/app/layout.tsx`: Add Supabase context provider
- Create `src/components/providers/`: Supabase, theme, toast providers
- Set up dark mode toggle

### 4.2 shadcn/ui Components

Install needed primitives:

```bash
npx shadcn@latest add button input label textarea select dialog card badge table dropdown-menu avatar
```

### 4.3 Domain Components

`src/components/`:

- `tickets/`: TicketCard, TicketList, TicketForm, StatusBadge
- `auth/`: LoginForm, UserMenu
- `kb/`: ArticleCard, ArticleSearch
- `shared/`: Header, Sidebar, EmptyState, LoadingSpinner

## Phase 5: Feature Modules (Post-Database)

### 5.1 Ticket Management Module

- Dashboard for employees (my tickets)
- Dashboard for staff (assigned tickets)
- Ticket detail view with timeline
- Create/edit ticket forms
- Comment system

### 5.2 Knowledge Base Module

- Article list and search
- Article detail with voting
- Article creation (AI-assisted)
- Category filtering

### 5.3 AI Integration (RAG)

- Chatbot component with streaming
- AI Assistant in ticket form
- Vector embedding generation
- Gemini API proxy routes

### 5.4 Analytics Dashboard

- KPI cards (ticket volume, resolution time, satisfaction)
- Charts (ticket trends, category distribution)
- Export functionality

### 5.5 Admin Module

- User management (CRUD)
- Role assignment
- Category management
- Feedback viewing (super_admin only)

## Performance Optimizations

- Use React Server Components by default
- Implement pagination with cursor-based approach
- Cache KB article embeddings
- Use Suspense boundaries for streaming
- Optimize images with next/image
- Implement request deduplication for Gemini API

## Testing Strategy

- Unit tests for utilities and validation
- Integration tests for API routes
- RLS policy testing with different roles
- E2E tests for critical flows (create ticket, resolve ticket)
- Load testing for vector search performance

### To-dos

- [ ] Create Supabase project and enable pgvector extension
- [ ] Create migration for PostgreSQL custom types (ENUMs)
- [ ] Create migration for all core tables with constraints
- [ ] Create migration for performance indexes (B-tree and HNSW vector)
- [ ] Create migration for Row Level Security policies
- [ ] Create migration for database functions and triggers
- [ ] Create migration for seed data (categories and super_admin)
- [ ] Install Supabase client libraries and dependencies
- [ ] Create Supabase client utilities (browser, server, service role)
- [ ] Generate TypeScript types from Supabase schema
- [ ] Create domain-specific TypeScript types and interfaces
- [ ] Set up authentication routes and middleware
- [ ] Create API route structure for tickets, KB, and search
- [ ] Create utility libraries (validation, errors, constants)
- [ ] Set up layouts, providers, and shadcn/ui components