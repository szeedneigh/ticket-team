# ADR 0002: Choose Supabase for Backend

## Status
Accepted

## Context
We need an operational backend with Postgres, Auth, REST, RLS, and real-time features.

## Decision
Adopt Supabase (PostgreSQL + Auth + PostgREST + Storage + Realtime) as the backend.

## Consequences
- Pros: Managed Postgres, RLS, out-of-the-box Auth, fast delivery.
- Cons: Vendor platform constraints; cost at scale.

## Alternatives Considered
- Custom Node/Express + Postgres: more control, slower delivery.
- Firebase: no Postgres; different data model and security model.
