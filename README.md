# Ticket Team

> Intelligent Helpdesk Platform for La Verdad Christian College

A centralized, AI-powered ticketing system that transforms MIS support operations through intelligent automation, knowledge retention, and data-driven insights. Built with RAG (Retrieval-Augmented Generation) to provide context-aware assistance and reduce resolution times.

## Key Features

- **🎫 Centralized Ticket Management** - Complete lifecycle tracking from submission to resolution with immutable audit trails
- **🤖 AI-Powered Support Funnel** - RAG-based chatbot and assistant that grounds responses in your institutional knowledge base
- **📚 Knowledge Base with Semantic Search** - pgvector-powered semantic search for accurate, context-aware article discovery
- **🔐 Role-Based Access Control** - Granular permissions enforced at the database level with PostgreSQL RLS
- **📊 Analytics & Reporting** - KPI dashboards for ticket volume, resolution times, and user satisfaction metrics

## Tech Stack

- **[Next.js 15](https://nextjs.org)** - React framework with App Router for SSR/CSR
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development with strict mode
- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, storage, and real-time subscriptions
- **[Gemini API](https://ai.google.dev/)** - AI-powered responses with RAG architecture
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first styling with modern theming
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component primitives built on Radix UI
- **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search for semantic KB retrieval

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm package manager
- Supabase account and project
- Gemini API key from Google AI Studio

### Installation

```bash
# Clone the repository
git clone <REPO_URL>
cd ticket-team

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Gemini credentials
```

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-only secrets
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Run Development Server

```bash
npm run dev
# or
pnpm dev

# Open http://localhost:3000
```

For detailed setup instructions, see the [Setup Guide](./docs/01-overview/setup-guide.md).

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Quick Start](./docs/01-overview/quick-start.md)** - Get up and running in minutes
- **[System Architecture](./docs/02-architecture/system-architecture.md)** - Technical design and RAG flow
- **[Database Schema](./docs/02-architecture/database-schema.md)** - Data model, ERD, and RLS policies
- **[API Endpoints](./docs/04-api/endpoints.md)** - REST API reference and schemas
- **[User Flows](./docs/03-features/user-flows.md)** - End-to-end use cases
- **[Development Guidelines](./docs/06-development/coding-standards.md)** - Coding standards and best practices

Browse the full documentation index: [docs/README.md](./docs/README.md)

## Project Structure

```
ticket-team/
├── src/
│   └── app/              # Next.js App Router pages and layouts
│       ├── layout.tsx    # Root layout with providers
│       ├── page.tsx      # Home page
│       └── globals.css   # Global styles + Tailwind
├── docs/                 # Comprehensive project documentation
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── eslint.config.mjs     # ESLint rules
```

For detailed folder structure and naming conventions, see [Folder Structure](./docs/02-architecture/folder-structure.md).

## Development

- **[Coding Standards](./docs/06-development/coding-standards.md)** - TypeScript patterns, naming, and security guidelines
- **[Git Workflow](./docs/06-development/git-workflow.md)** - Branching model and commit conventions
- **[Testing](./docs/06-development/testing.md)** - Unit, integration, and E2E testing strategies
- **[Deployment](./docs/06-development/deployment.md)** - Vercel deployment and environment setup

## Architecture Decision Records

Key technical decisions are documented in [ADRs](./docs/adr/):

- [ADR 0001: Choose Next.js](./docs/adr/0001-nextjs.md)
- [ADR 0002: Choose Supabase](./docs/adr/0002-supabase.md)
- [ADR 0003: Choose Gemini API](./docs/adr/0003-gemini-api.md)
- [ADR 0004: Adopt RAG Architecture](./docs/adr/0004-RAG-architecture.md)

## Contributing

Please follow the [Git Workflow](./docs/06-development/git-workflow.md) and [Coding Standards](./docs/06-development/coding-standards.md) when contributing to this project.

## License

This software system is developed solely for internal, non-commercial educational use within La Verdad Christian College - Apalit, Pampanga

---

**La Verdad Christian College** | Management Information Systems Department
