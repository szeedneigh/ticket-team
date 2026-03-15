# Capstone Defense Presentation Outline

**Ticket Team: AI-Powered Helpdesk for La Verdad Christian College**

---

## Suggested Slide Structure (15–20 minutes)

### Slide 1: Title Slide
- **Title:** Ticket Team: AI-Powered Helpdesk Platform for La Verdad Christian College
- **Subtitle:** Capstone Research Defense
- **Presenters:** Team 5
- **Date:** February 5, 2026
- **Institution:** La Verdad Christian College

---

### Slide 2: Agenda
1. Introduction and Context
2. Statement of the Problem
3. Objectives and Significance
4. System Design and Architecture
5. Key Features and Innovations
6. Implementation and Results
7. Security and Compliance
8. Conclusions and Recommendations
9. Q&A

---

### Slide 3: Introduction
- **Context:** MIS department at LVCC supports faculty and staff with IT concerns
- **Current Process:** Manual, informal (phone, email, in-person)
- **Pain Points:** No central record, triage bottlenecks, no knowledge base, no analytics

---

### Slide 4: Statement of the Problem — Current vs Proposed

| Current (As-Is) | Proposed (To-Be) |
|-----------------|------------------|
| Multiple channels | Single AI funnel + ticket form |
| Manual triage | AI first-line support |
| No KB | Semantic search KB |
| Informal closure | Automated notifications |
| No metrics | Analytics dashboard |

---

### Slide 5: Objectives
1. Centralized ticketing with full lifecycle
2. RAG-based AI support
3. Searchable knowledge base with semantic search
4. Role-based access control (4 roles)
5. Analytics and reporting
6. Data integrity (audit trails, soft deletes)

---

### Slide 6: Scope and Delimitations
- **In Scope:** End-to-end tickets, RBAC, AI funnel, KB, analytics, internal use
- **Out of Scope:** Inter-departmental ticketing, native app, SIS/HRIS integration, custom AI training

---

### Slide 7: System Architecture (Diagram)
- **Presentation:** Next.js 15, React 19, shadcn/ui, Tailwind
- **API:** Next.js API Routes, Server Actions
- **Backend:** Supabase (PostgreSQL, Auth, Storage, pgvector)
- **AI:** Google Gemini API (embeddings + chat)

---

### Slide 8: RAG Architecture Flow
1. User query → API
2. Generate embedding (768-dim)
3. Vector search (pgvector, Top-K, threshold 0.7)
4. Augment prompt with KB context
5. Stream response via Gemini
6. Log interaction

---

### Slide 9: Data Model (Core Entities)
- users, tickets, ticket_comments, ticket_activities, ticket_feedback
- knowledge_articles (with embeddings)
- ai_interactions
- attachments

---

### Slide 10: Ticket Lifecycle
- OPEN → IN_PROGRESS ↔ ON_HOLD → RESOLVED → CLOSED
- REOPEN, CANCELED
- Role-based transitions

---

### Slide 11: Key Features — Ticketing
- Create ticket (form or AI escalation)
- Assign, status, priority
- Comments (public + internal)
- Attachments
- Feedback (1–5 stars)
- Activity audit trail

---

### Slide 12: Key Features — AI Chat (Timi)
- RAG-grounded responses
- Streaming via SSE
- KB article citations
- Ticket escalation with pre-populated data
- Category detection (KB → keywords → AI)
- Staff assignment suggestion (workload-based)

---

### Slide 13: Key Features — Knowledge Base
- Rich text editor (Tiptap)
- Semantic search (pgvector)
- Voting (helpful/not helpful)
- AI-assisted article creation from resolved tickets
- Analytics dashboard

---

### Slide 14: Key Features — Analytics
- Ticket volume and trends
- Resolution times
- Satisfaction metrics
- AI analytics (helpfulness, escalation)
- Category/priority distribution

---

### Slide 15: Security
- RLS on all 16 tables
- Split environment variables (client vs server)
- Build-time security scan
- Input validation (Zod)
- No secrets in client bundle

---

### Slide 16: Implementation Statistics
- 31+ pages, 160+ components
- 35+ server actions, 15+ API routes
- 16 tables, 36 migrations
- ~50,000+ lines of code

---

### Slide 17: Results and Deliverables
- ~90% feature complete
- Production-ready
- 28 features implemented
- Comprehensive documentation

---

### Slide 18: Conclusions
1. System addresses manual process inefficiencies
2. RAG grounds AI in institutional knowledge
3. Security-first design
4. Production-ready with documented gaps

---

### Slide 19: Recommendations
- **Immediate:** Email config, UAT
- **Short-term:** Analytics export, chat E2E tests
- **Long-term:** Real-time notifications, integrations

---

### Slide 20: Thank You / Q&A
- Thank the panel
- Invite questions

---

## Demo Script (5–10 minutes)

1. **Landing Page** → Sign in (Google SSO)
2. **AI Chat** → Ask "How do I reset my password?" → Show RAG response with citations
3. **Escalation** → Click "Create Ticket" → Show pre-populated form
4. **Ticket List** → Filter, search
5. **Ticket Detail** → Status, comments, timeline
6. **Knowledge Base** → Search, article view, voting
7. **Analytics** (if admin) → KPIs, charts

---

## Key Talking Points

- **RAG:** "We use Retrieval-Augmented Generation so the AI answers are grounded in our institutional knowledge base, not made up."
- **Security:** "Every table has Row Level Security. Server secrets never reach the browser."
- **Knowledge Loop:** "When staff resolve a ticket, they can generate a KB article draft with AI, which then improves future AI responses."
- **Scalability:** "The architecture supports future enhancements like real-time notifications and integrations."
