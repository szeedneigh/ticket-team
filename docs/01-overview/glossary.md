# Glossary

> Definitions for key terms used throughout the documentation.

## Table of Contents
- [RAG](#rag)
- [RLS](#rls)
- [pgvector](#pgvector)
- [SSR / CSR](#ssr--csr)
- [PostgREST](#postgrest)
- [JWT](#jwt)
- [Service Role](#service-role)
- [ADR](#adr)
- [KPI](#kpi)
- [KB (Knowledge Base)](#kb-knowledge-base)
- [Priority](#priority)

## RAG
Retrieval-Augmented Generation. Retrieve relevant documents to augment a prompt sent to an LLM to produce grounded, context-aware responses.

## RLS
Row Level Security. PostgreSQL feature (exposed by Supabase) enabling per-row access rules enforced by the database.

## pgvector
PostgreSQL extension providing a `vector` type and similarity search operations used for semantic search.

## SSR / CSR
Server-Side Rendering / Client-Side Rendering. Next.js supports both; SSR can improve performance and SEO.

## PostgREST
Auto-generated REST API over PostgreSQL. Supabase exposes this for direct CRUD with RLS enforcement.

## JWT
JSON Web Token. Used for stateless authentication and authorization.

## Service Role
Privileged key for server-side operations (never exposed to clients). Used by API routes to perform actions bypassing RLS where necessary.

## ADR
Architecture Decision Record. A document that captures a significant architectural decision and its rationale.

## KPI
Key Performance Indicator. Quantifiable measure of performance (e.g., resolution time, satisfaction score).

## KB (Knowledge Base)
A repository of institutional articles and solutions used by users and the AI for self-service and grounding.

## Priority
Urgency classification for tickets. Three levels: low (minor issues), medium (standard workflow disruption), high (critical business impact). Maps to the `ticket_priority` enum in the database.
