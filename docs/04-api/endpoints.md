# API Endpoints

> REST/GraphQL endpoints, parameters, and responses.

## Table of Contents
- [Conventions](#conventions)
- [Authentication](#authentication)
- [Tickets](#tickets)
- [Comments](#comments)
- [Knowledge Base](#knowledge-base)
- [Search (RAG)](#search-rag)
- [Analytics](#analytics)
- [Pagination & Filtering](#pagination--filtering)
- [Errors](#errors)
- [Schemas and Contracts](#schemas-and-contracts)
  - [Enums](#enums)
  - [Resource Schemas](#resource-schemas)
- [References](#references)

## Conventions
- Base path: `/api/v1` for serverless routes. Use Supabase PostgREST for direct CRUD where appropriate.
- JSON request/response. Timestamps are ISO 8601.
- Auth via `Authorization: Bearer <jwt>`.

## Authentication
See: [Authentication](./authentication.md). RLS policies guard direct table access; sensitive actions should go through serverless routes with service role where required.

## Tickets

### Create Ticket
```http
POST /api/v1/tickets
Authorization: Bearer <jwt>
Content-Type: application/json

{ "title": "Printer not working", "category": "Hardware", "urgency": "High", "description": "..." }
```
```json
{ "id": "6e8b2b2a-...", "status": "Open" }
```

### Get Ticket by ID
```http
GET /api/v1/tickets/123
Authorization: Bearer <jwt>
```
```json
{ "id": "6e8b2b2a-...", "title": "Printer not working", "status": "Open", "comments": [] }
```

### List Tickets
```http
GET /api/v1/tickets?status=open&page=1&page_size=20
Authorization: Bearer <jwt>
```

### Update Ticket Status/Priority/Assignment
```http
PATCH /api/v1/tickets/123
Authorization: Bearer <jwt>
Content-Type: application/json

{ "status": "In Progress", "assigned_to": "<user_id>" }
```

## Comments

### Add Comment to Ticket
```http
POST /api/v1/tickets/123/comments
Authorization: Bearer <jwt>
Content-Type: application/json

{ "body": "Please try restarting the device." }
```

### List Comments for Ticket
```http
GET /api/v1/tickets/123/comments
Authorization: Bearer <jwt>
```

## Knowledge Base

### Create Article (AI-assisted downstream)
```http
POST /api/v1/kb/articles
Authorization: Bearer <jwt>
Content-Type: application/json

{ "title": "Fix printer jam", "content": "...", "category": "Hardware" }
```

### List Articles
```http
GET /api/v1/kb/articles?category=Hardware&q=printer
```

## Search (RAG)

### Semantic Search in Knowledge Base
```http
POST /api/v1/search
Authorization: Bearer <jwt>
Content-Type: application/json

{ "query": "How to fix paper jam?", "top_k": 5 }
```
```json
{ "matches": [ { "article_id": 42, "score": 0.89, "snippet": "..." } ] }
```

## Analytics

### Summary KPIs
```http
GET /api/v1/analytics/summary?from=2025-01-01&to=2025-01-31
Authorization: Bearer <jwt>
```
```json
{
  "ticketVolume": { "created": 120, "resolved": 110 },
  "avgFirstResponseMinutes": 45,
  "avgResolutionHours": 26.2,
  "satisfaction": 4.4
}
```

## RPCs and Restricted Operations

### Soft Delete Attachment (RPC)
```http
POST /rpc/attachments_soft_delete
Authorization: Bearer <jwt>
Content-Type: application/json

{ "p_attachment_id": "<uuid>" }
```
- Auth: `staff | admin | super_admin`
- Effect: sets `deleted_at`, `deleted_by` on `attachments`; storage object retained/quarantined.
- Notes: no direct DELETE on attachments.

### Deactivate User (RPC)
```http
POST /rpc/deactivate_user
Authorization: Bearer <jwt>
Content-Type: application/json

{ "p_user_id": "<uuid>" }
```
- Auth: `admin | super_admin`
- Guardrails: cannot deactivate a `super_admin` unless caller is `super_admin`.
- Notes: no DELETE endpoint for users; use deactivation.

### Feedback Access
- Create feedback: available to ticket submitter.
- Read/manage feedback: `super_admin` only. No general feedback listing for other roles.

## Deletions
- Tickets, comments, users, feedback: no DELETE endpoints.
- Use status transitions, immutability, and RPC-driven soft deletes as documented above.

## Pagination & Filtering
- Use `page` and `page_size` query params.
- Filtering by `status`, `category`, `assigned_to`, `date_range` where supported.

## Errors
Standard error payloads:
```json
{ "error": { "code": "validation_error", "message": "Title is required" } }
```
Common codes: `unauthorized`, `forbidden`, `not_found`, `validation_error`, `rate_limited`, `internal_error`.

Details:
- `unauthorized`: Missing/invalid JWT.
- `forbidden`: Authenticated but lacks permission (RLS/policy).
- `not_found`: Resource does not exist or not visible under RLS.
- `validation_error`: Body/query fails validation.
- `rate_limited`: Too many requests; backoff recommended.
- `internal_error`: Unhandled server error.

## Schemas and Contracts

### Enums
- TicketStatus: `"Open" | "In Progress" | "On Hold" | "Resolved" | "Closed" | "Canceled"`
- Urgency: `"Low" | "Medium" | "High"`
- Priority: `"Low" | "Medium" | "High"`

### Resource Schemas

Ticket
```json
{
  "$id": "Ticket",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string", "minLength": 3 },
    "description": { "type": "string" },
    "status": { "type": "string", "enum": ["Open", "In Progress", "On Hold", "Resolved", "Closed", "Canceled"] },
    "urgency": { "type": "string", "enum": ["Low", "Medium", "High"] },
    "priority": { "type": "string", "enum": ["Low", "Medium", "High"] },
    "submitter_id": { "type": "string", "format": "uuid" },
    "assigned_to": { "type": "string", "format": "uuid" },
    "category": { "type": "string" },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "required": ["title", "status", "urgency", "submitter_id"],
  "additionalProperties": false
}
```

Comment
```json
{
  "$id": "Comment",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "ticket_id": { "type": "string", "format": "uuid" },
    "author_id": { "type": "string", "format": "uuid" },
    "body": { "type": "string", "minLength": 1 },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "required": ["ticket_id", "author_id", "body"],
  "additionalProperties": false
}
```

KBArticle
```json
{
  "$id": "KBArticle",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string", "minLength": 3 },
    "content": { "type": "string" },
    "category": { "type": "string" },
    "author_id": { "type": "string", "format": "uuid" },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "required": ["title", "content", "author_id"],
  "additionalProperties": false
}
```

Category
```json
{
  "$id": "Category",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" }
  },
  "required": ["name"],
  "additionalProperties": false
}
```

Feedback
```json
{
  "$id": "Feedback",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "ticket_id": { "type": "string", "format": "uuid" },
    "author_id": { "type": "string", "format": "uuid" },
    "rating": { "type": "integer", "minimum": 1, "maximum": 5 },
    "comment": { "type": "string" },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "required": ["ticket_id", "author_id", "rating"],
  "additionalProperties": false
}
```

Attachment
```json
{
  "$id": "Attachment",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "ticket_id": { "type": "string", "format": "uuid" },
    "url": { "type": "string", "format": "uri" },
    "mime_type": { "type": "string" },
    "size_bytes": { "type": "integer", "minimum": 0 }
  },
  "required": ["ticket_id", "url", "mime_type"],
  "additionalProperties": false
}
```

SearchRequest
```json
{
  "$id": "SearchRequest",
  "type": "object",
  "properties": {
    "query": { "type": "string", "minLength": 1 },
    "top_k": { "type": "integer", "minimum": 1, "maximum": 20 }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

SearchResponse
```json
{
  "$id": "SearchResponse",
  "type": "object",
  "properties": {
    "matches": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "article_id": { "type": "string", "format": "uuid" },
          "score": { "type": "number" },
          "snippet": { "type": "string" }
        },
        "required": ["article_id", "score"],
        "additionalProperties": false
      }
    }
  },
  "required": ["matches"],
  "additionalProperties": false
}
```

## References
- See also: [Authentication](./authentication.md)
- See also: [Database Schema](../02-architecture/database-schema.md)
- See also: [User Flows](../03-features/user-flows.md)
- See also: [Data Dictionary](../05-data-dictionary/data-dictionary.md)
- See also: [Ticket Lifecycle](../03-features/ticket-lifecycle.md)
