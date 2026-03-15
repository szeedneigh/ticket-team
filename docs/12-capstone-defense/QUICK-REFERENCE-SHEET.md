 # Capstone Defense Quick Reference Sheet

**Ticket Team — One-Page Cheat Sheet**

---

## Project in One Sentence

Ticket Team is an AI-powered helpdesk platform for La Verdad Christian College that combines centralized ticketing with RAG-based AI support to reduce resolution times and retain institutional knowledge.

---

## Problem → Solution

| Problem | Solution |
|--------|----------|

| No central record | Single ticket form + AI funnel |
| Manual triage | AI first-line support (RAG) |
| No knowledge base | Semantic search KB with pgvector |
| Informal closure | Automated notifications |
| No analytics | Dashboard with KPIs |

---

## Tech Stack (Memorize)

- **Frontend:** Next.js 15, React 19, Tailwind v4, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, pgvector)
- **AI:** Google Gemini API (@google/genai)
- **Deploy:** Vercel

---

## RAG in 5 Steps

1. User asks question
2. Generate 768-dim embedding (text-embedding-004)
3. Vector search: `match_kb_articles` (threshold 0.7, Top-5)
4. Augment prompt: system rules + KB context + query
5. Stream response via Gemini (gemini-2.0-flash-exp)

---

## User Roles

| Role | Key Capabilities |
|-----|------------------|
| Employee | Create tickets, comment, feedback, AI chat |
| Staff | Assign, resolve, KB management, internal notes |
| Admin | User management + staff |
| Super Admin | Feedback analytics + full access |

---

## Ticket Status Flow

OPEN → IN_PROGRESS ↔ ON_HOLD → RESOLVED → CLOSED | CANCELED

---

## Security Highlights

- RLS on all 16 tables
- Split env: `clientEnv` (browser) vs `serverEnv` (server only)
- `check-bundle-security` in postbuild
- Zod validation on all inputs

---

## Key Numbers

- 31+ pages
- 160+ components
- 35+ server actions
- 16 tables (all RLS)
- 36 migrations
- ~50,000 LOC

---

## ADRs (If Asked)

- **0001:** Next.js — SSR, Vercel, ecosystem
- **0002:** Supabase — Postgres, RLS, Auth, pgvector
- **0003:** Gemini — Capability, API accessibility
- **0004:** RAG — Grounded answers, traceability, domain specificity

---

## Common Q&A Answers

**Why RAG?** Grounded, citeable answers; no fine-tuning; KB updates immediately improve AI.

**Why pgvector?** Semantic search; HNSW index; native to PostgreSQL.

**Why Supabase?** Managed Postgres, RLS, Auth, Storage, pgvector in one platform.

**Limitations?** Single department; web only; no SIS integration; external AI API.
