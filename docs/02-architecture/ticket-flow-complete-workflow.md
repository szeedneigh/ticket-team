# Ticket Flow: Complete Workflow

> Comprehensive guide to how tickets move through the Ticket Team system from creation to closure.

## Table of Contents

1. [Overview](#overview)
2. [Ticket Entry Points](#ticket-entry-points)
3. [Status Lifecycle](#status-lifecycle)
4. [Role-Based Access](#role-based-access)
5. [Detailed Workflow Stages](#detailed-workflow-stages)
6. [Supporting Features](#supporting-features)
7. [Data Flow & Audit Trail](#data-flow--audit-trail)

---

## Overview

The Ticket Team system is an AI-powered helpdesk for La Verdad Christian College. Tickets follow a **state machine** with six statuses, enforced by **Row Level Security (RLS)** and **role-based permissions**. Every action is logged in `ticket_activities` for audit.

### Key Entities

| Entity | Purpose |
|--------|---------|
| `tickets` | Central support request record |
| `ticket_comments` | Public and internal communication |
| `ticket_activities` | Immutable audit log of all changes |
| `ticket_feedback` | Post-resolution satisfaction (1–5 stars) |
| `attachments` | Files linked to tickets or comments |

---

## Ticket Entry Points

Tickets can be created in **two ways**:

### 1. Direct Ticket Creation (Form)

**Route:** `/tickets/new`  
**Component:** `TicketForm` → Server Action `createTicket`

**Flow:**
1. User fills form: title, description, category, subcategory, priority
2. Optional: attach files (validated for type and size)
3. Server Action validates with Zod schema
4. Ticket inserted with `status: 'open'`, `user_id: current_user`
5. Files uploaded to Supabase Storage, records in `attachments`
6. Activities logged: `ticket_created`, `attachment_added` per file
7. AI event logged for learning (non-blocking)
8. User redirected to `/tickets/[id]`

**Validation:**
- Title: min 5 chars
- Description: min 10 chars
- Category: required
- Files: max size, allowed types (images, documents, archives)

### 2. Escalation from AI Chat

**Route:** `/chat` (AI assistant)  
**Flow:** Chat → AI suggests escalation → `TicketReviewModal` → `createTicketFromChat`

**Flow:**
1. User chats with AI assistant (RAG over knowledge base)
2. AI determines issue needs human support
3. AI prepares ticket data: title, description, category, priority, suggested staff
4. User reviews and edits in `TicketReviewModal`
5. `createTicketFromChat` creates ticket with metadata:
   - `escalated_from_chat: true`
   - `session_id`, `interaction_id`
   - `created_via_ai_assistant: true`
6. AI interaction linked to ticket via `linkInteractionToTicket`
7. User redirected to ticket detail page

---

## Status Lifecycle

### Status Enum

```sql
ticket_status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'canceled'
```

### State Diagram

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                     TICKET LIFECYCLE                         │
                    └─────────────────────────────────────────────────────────────┘

    [*] ──────► OPEN ─────────────────────────────────────────────────────────────┐
         │         │                                                               │
         │         │  Staff: assign / start work                                    │
         │         ▼                                                               │
         │    IN_PROGRESS ◄──────────────────┐                                     │
         │         │                         │                                     │
         │         │  Waiting on user/parts   │  Info received / unblocked          │
         │         ▼                         │                                     │
         │    ON_HOLD ────────────────────────┘                                     │
         │         │                                                               │
         │         │  (from in_progress)                                            │
         │         │  Fix applied / solution verified                               │
         │         ▼                                                               │
         │    RESOLVED ──► (await confirmation) ──► CLOSED                           │
         │         │              │                    │                            │
         │         │              │                    │  Reopened (with reason)    │
         │         │              └────────────────────┴───────────────────────────┤
         │         │                                                               │
         │         │  (from open, in_progress, on_hold)                             │
         │         ▼                                                               │
         │    CANCELED ◄────────────────────────────────────────────────────────────┘
         │
         └── Reopen: RESOLVED/CLOSED → OPEN (submitter or staff, with justification)
```

### Status Meanings

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| **open** | New ticket, awaiting staff | Initial state, or via reopen |
| **in_progress** | Staff actively working | Staff, Admin, Super Admin |
| **on_hold** | Waiting on user info or parts | Staff, Admin, Super Admin |
| **resolved** | Fix applied, awaiting user confirmation | Staff, Admin, Super Admin |
| **closed** | User confirmed or auto-closed | Staff, Admin, Super Admin |
| **canceled** | Withdrawn, duplicate, or out of scope | Staff, Admin, Super Admin |

### Transition Rules

- **Only staff/admin/super_admin** may change status (except reopen).
- **Reopen:** Submitter or staff can reopen `resolved` or `closed` tickets with a reason (min 10 chars).
- **Resolved:** Should include documented solution; KB article link when feasible.
- **Closed:** Can be manual or auto-close after configurable period in `resolved` with no submitter response.

---

## Role-Based Access

### User Roles

| Role | Ticket Visibility | Actions |
|------|------------------|---------|
| **employee** | Own tickets only | Create, comment, view, reopen (own), feedback |
| **staff** | Own + assigned + all | Assign, status, priority, internal notes |
| **admin** | All tickets | Same as staff |
| **super_admin** | All + feedback analytics | Same as admin + delete tickets |

### RLS Policies (Tickets)

- **SELECT:** Submitter, assigned staff, or staff/admin/super_admin
- **INSERT:** Authenticated users (own tickets only, `user_id = auth.uid()`)
- **UPDATE:** Staff, admin, super_admin only
- **DELETE:** Super_admin only (soft-delete via status preferred)

---

## Detailed Workflow Stages

### Stage 1: Creation → Open

1. Ticket created with `status: 'open'`, `assigned_to: null`
2. `ticket_activities`: `ticket_created`
3. Submitter sees ticket in `/tickets` (filterable by status)
4. Staff sees unassigned tickets in `/tickets/queue`

### Stage 2: Staff Picks Up Ticket (Queue)

**Route:** `/tickets/queue`

- Lists tickets with `status IN ('open', 'in_progress')` and `assigned_to IS NULL`
- Stats by priority: critical, urgent, high, medium
- Staff assigns ticket to self or colleague via `assignTicket`
- On assignment:
  - `assigned_to` updated
  - Email notification to assignee
  - `ticket_activities`: `ticket_assigned` or `assignment_changed`
  - AI event logged

### Stage 3: In Progress / On Hold

- Staff changes status via `TicketActions` dropdown
- **in_progress:** Actively working
- **on_hold:** Waiting on user response, parts, or external dependency
- Status changes:
  - `updateTicketStatus` Server Action
  - Email to submitter (for resolved/closed)
  - `ticket_activities`: `status_changed`
  - AI event logged

### Stage 4: Communication (Comments)

**Public comments:** Visible to submitter and staff  
**Internal notes:** Staff only (`is_internal: true`)

- `createComment` Server Action
- Optional file attachments
- Email notification to relevant parties
- `ticket_activities`: `comment_added` or `internal_note_added`

### Stage 5: Resolution

1. Staff sets status to **resolved**
2. `resolved_at` timestamp set
3. Email to submitter: "Your ticket has been resolved. Please review and provide feedback."
4. Submitter sees **Feedback Prompt** on ticket detail page

### Stage 6: Feedback (Post-Resolution)

- Only **submitter** can provide feedback
- Only when ticket is **resolved**
- One feedback per user per ticket
- Rating: 1–5 stars, optional comment
- `submitTicketFeedback` → `ticket_feedback` insert
- `ticket_activities`: `feedback_submitted`

### Stage 7: Closure

- Staff sets status to **closed**
- `closed_at` timestamp set
- Email to submitter
- (Future: auto-close after period in resolved with no response)

### Stage 8: Reopen (Optional)

- Submitter or staff can reopen **resolved** or **closed** tickets
- Requires reason (min 10 chars)
- `reopenTicket` Server Action:
  - Status → `open`
  - `resolved_at`, `closed_at` cleared
  - `ticket_activities`: `ticket_reopened` with reason in metadata

### Stage 9: Cancellation

- Staff can set status to **canceled** from open, in_progress, or on_hold
- Use cases: duplicate, withdrawn, out of scope, no response

---

## Supporting Features

### Ticket Queue (`/tickets/queue`)

- **Purpose:** Staff triage unassigned tickets
- **Filters:** `status IN ('open', 'in_progress')`, `assigned_to IS NULL`
- **Stats:** Total, critical, urgent, high, medium, oldest (days)
- **Actions:** Assign from queue (via ticket detail)

### Ticket List (`/tickets`)

- **Filters:** Status tabs, priority, search, time period
- **Pagination:** Configurable page size
- **Views:** Table with status, priority, assignee, dates

### Ticket Detail (`/tickets/[id]`)

- Header: status, priority, category, dates
- Description, attachments
- Timeline: activities + comments
- **Staff:** Status, assignment, priority dropdowns; reopen dialog
- **All:** Comment box, feedback prompt (resolved + submitter)

### Attachments

- Stored in Supabase Storage bucket `ticket-attachments`
- Records in `attachments` table
- Download via signed URL (`getAttachmentDownloadUrl`)
- Soft delete: `deleted_at`, `deleted_by`

### Notifications

- **In-app:** `notifications` table, triggers on status change, assignment, comment
- **Email:** `notifyTicketStatusChange`, `notifyTicketAssignment`, `notifyTicketComment`
- User preferences: `notification_preferences` (e.g. `ticket_status_changed_email`)

---

## Data Flow & Audit Trail

### Activity Types Logged

| Action | Activity Type | Metadata |
|--------|--------------|----------|
| Create ticket | `ticket_created` | title, category, priority, attachments_count |
| Add attachment | `attachment_added` | filename, size, type |
| Change status | `status_changed` | from, to |
| Assign | `ticket_assigned` / `assignment_changed` / `ticket_unassigned` | assigned_to_name |
| Change priority | `priority_changed` | from, to |
| Add comment | `comment_added` / `internal_note_added` | — |
| Reopen | `ticket_reopened` | reason, from_status |
| Feedback | `feedback_submitted` | rating |

### Immutable Entities

- `ticket_comments` — append-only (no UPDATE/DELETE for audit)
- `ticket_activities` — append-only
- `ticket_feedback` — one per user per ticket, immutable

### AI Event Logging

Non-blocking events for learning/analytics:

- `ticket_created`
- `ticket_status_change`
- `ticket_assigned`

---

## Summary: End-to-End Flow

```
1. CREATE     Employee/Chat → Ticket (open)
2. QUEUE      Staff views unassigned tickets
3. ASSIGN     Staff assigns to self/colleague
4. WORK       Status: in_progress ↔ on_hold
5. RESOLVE    Staff sets resolved, documents solution
6. FEEDBACK   Submitter rates 1–5 stars (optional)
7. CLOSE      Staff closes (or auto-close)
8. REOPEN     Submitter/Staff reopens with reason (optional)
9. CANCEL     Staff cancels (optional, from active states)
```

---

## References

- [Ticket Lifecycle](./ticket-lifecycle.md) — State machine diagram
- [Database Schema](./database-schema.md) — Table definitions
- [System Architecture](./system-architecture.md) — Overall design
- [RLS Policies](../../supabase/migrations/20250114000004_create_rls_policies.sql)
