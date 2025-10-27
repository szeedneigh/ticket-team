# Cursor Rules for Ticket-Team Project

This directory contains Cursor rules that guide AI-assisted development for the Ticket-Team helpdesk system.

## Table of Contents

- [Always Applied Rules](#always-applied-rules)
- [Fetchable Rules](#fetchable-rules)
- [File-Specific Rules](#file-specific-rules)
- [How to Use](#how-to-use)

## Always Applied Rules

These rules are automatically applied to every AI request:

### 📁 [`project-structure.mdc`](./project-structure.mdc)
**What it covers**: Project layout, entry points, and conventions
- Next.js App Router structure
- TypeScript configuration and path aliases
- Directory organization patterns
- Main configuration files (next.config.ts, tsconfig.json, etc.)

## Fetchable Rules

These rules can be fetched by the AI when relevant to the task:

### 📚 [`docs-security-integrity.mdc`](./docs-security-integrity.mdc)
**What it covers**: Documentation references, ADRs, and security constraints
- Links to Architecture Decision Records (ADRs)
- Security principles (RLS, least privilege)
- Data immutability requirements
- Soft delete patterns

### ✅ [`eslint-quality.mdc`](./eslint-quality.mdc)
**What it covers**: Linting and code quality standards
- ESLint configuration
- Import ordering
- Quality gates and pre-commit checks

### 🛣️ [`next-app-router.mdc`](./next-app-router.mdc)
**What it covers**: Next.js App Router conventions
- Route organization in `src/app/*`
- Server vs. client components
- Data fetching patterns
- Metadata and static assets

### 🗄️ [`supabase-integration.mdc`](./supabase-integration.mdc)
**What it covers**: Supabase backend integration patterns
- Client initialization (server, client, admin)
- Row Level Security (RLS) policies
- Database conventions (naming, timestamps, audit fields)
- Error handling for Supabase operations
- Soft delete and immutability patterns

### 🤖 [`ai-rag-patterns.mdc`](./ai-rag-patterns.mdc)
**What it covers**: AI integration and RAG architecture
- Gemini API usage (server-side only)
- Retrieval-Augmented Generation (RAG) flow
- pgvector embeddings and similarity search
- AI support funnel (chatbot, assistant, KB creation)
- Prompt engineering best practices
- Error handling for AI operations

### 🔒 [`data-integrity.mdc`](./data-integrity.mdc)
**What it covers**: Data integrity, immutability, and audit trails
- Immutability rules for comments and history
- Ticket lifecycle and status transitions
- Soft delete patterns for users and attachments
- Audit trail implementation (created_by, updated_at, etc.)
- Change tracking and history tables
- Feedback isolation (write-only for employees)

### 🧩 [`component-patterns.mdc`](./component-patterns.mdc)
**What it covers**: React component composition and patterns
- Server vs. client component guidelines
- shadcn/ui integration
- Component organization and naming
- Data fetching in components
- Forms and Server Actions
- Error boundaries and accessibility
- Performance optimization (memoization, lazy loading)

### 🔐 [`security-auth.mdc`](./security-auth.mdc)
**What it covers**: Security, authentication, and authorization
- Supabase Auth integration
- Session management with cookies
- Role-based access control (RBAC)
- RLS policy examples
- Secrets management (environment variables)
- Input validation and sanitization
- File upload security
- XSS/CSRF prevention
- Security headers and logging

### ⚡ [`performance-optimization.mdc`](./performance-optimization.mdc)
**What it covers**: Performance optimization strategies
- Database performance (indexing, query optimization)
- Caching strategies (ISR, SWR)
- React performance (memoization, code splitting, virtualization)
- Image optimization with next/image
- AI streaming responses
- Bundle size optimization
- Network performance (parallel requests, compression)
- Monitoring and Core Web Vitals

### 🧪 [`testing-quality.mdc`](./testing-quality.mdc)
**What it covers**: Testing strategies and QA practices
- Testing pyramid and strategy
- Unit testing (components, utilities)
- Integration testing (Server Actions, API routes)
- E2E testing (Playwright)
- Database and RLS policy testing
- Mocking strategies (Supabase, AI)
- Quality gates and CI/CD
- Accessibility and performance testing

## File-Specific Rules

These rules automatically apply when working with specific file types:

### 🎨 [`tailwind-v4.mdc`](./tailwind-v4.mdc)
**Applies to**: `*.css`, `*.tsx`
**What it covers**: Tailwind CSS v4 styling conventions
- Utility-first approach
- CSS variable tokens
- Dark mode implementation
- Custom token alignment

### 📘 [`typescript-imports.mdc`](./typescript-imports.mdc)
**Applies to**: `*.ts`, `*.tsx`
**What it covers**: TypeScript and import conventions
- Strict TypeScript usage
- Path alias patterns (`@/*`)
- ESM syntax requirements
- Client vs. server code separation
- Avoiding barrel cycles

## How to Use

### For Developers

1. **Starting a new feature**: Review relevant rules (e.g., `component-patterns.mdc`, `security-auth.mdc`)
2. **Working with Supabase**: Check `supabase-integration.mdc` and `data-integrity.mdc`
3. **Implementing AI features**: Reference `ai-rag-patterns.mdc`
4. **Optimizing performance**: Consult `performance-optimization.mdc`
5. **Writing tests**: Follow `testing-quality.mdc`

### For AI Assistants

- Always apply rules from `project-structure.mdc`
- Fetch specific rules based on the task context
- File-specific rules (globs) apply automatically when editing matching files
- Cross-reference rules using `mdc:` links
- Prioritize security and data integrity constraints

## Architecture Decision Records (ADRs)

Key technology decisions are documented in `docs/adr/`:
- [0001-nextjs.md](../docs/adr/0001-nextjs.md): Next.js framework choice
- [0002-supabase.md](../docs/adr/0002-supabase.md): Supabase backend
- [0003-gemini-api.md](../docs/adr/0003-gemini-api.md): Gemini API for AI
- [0004-RAG-architecture.md](../docs/adr/0004-RAG-architecture.md): RAG pattern

## Additional Documentation

For comprehensive project documentation, see:
- [docs/01-overview/](../docs/01-overview/): Project overview and quick start
- [docs/02-architecture/](../docs/02-architecture/): System architecture and database schema
- [docs/03-features/](../docs/03-features/): Feature specifications
- [docs/04-api/](../docs/04-api/): API and authentication
- [docs/05-components/](../docs/05-components/): Component library and styling
- [docs/06-development/](../docs/06-development/): Development guides and standards
- [docs/07-troubleshooting/](../docs/07-troubleshooting/): Common issues and debugging

## Contributing

When adding new rules:
1. Use `.mdc` extension
2. Include proper frontmatter with `description`, `alwaysApply`, or `globs`
3. Reference related files using `[filename](mdc:path/to/file)`
4. Cross-reference other rules and documentation
5. Keep rules focused and actionable
6. Update this README with a summary

## Rule Priority

1. **Security & Integrity** (highest): Never compromise on security or data integrity
2. **Architecture**: Follow established patterns (Next.js, Supabase, RAG)
3. **Performance**: Optimize without sacrificing maintainability
4. **Code Quality**: Maintain consistent style and testing
5. **Developer Experience**: Write clear, self-documenting code

---

Last updated: 2025-10-13

