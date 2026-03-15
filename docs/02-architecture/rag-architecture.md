# RAG Architecture Documentation

> Retrieval-Augmented Generation (RAG) for the Ticket Team AI Helpdesk

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Complete Data Flow](#complete-data-flow)
5. [Embedding Generation](#embedding-generation)
6. [Semantic Search (Retrieval)](#semantic-search-retrieval)
7. [Context Assembly (Augmentation)](#context-assembly-augmentation)
8. [Response Generation](#response-generation)
9. [Streaming Implementation](#streaming-implementation)
10. [Caching Layer](#caching-layer)
11. [Rate Limiting & Circuit Breaker](#rate-limiting--circuit-breaker)
12. [Citation Handling](#citation-handling)
13. [Conversation History](#conversation-history)
14. [Escalation Detection](#escalation-detection)
15. [Error Handling & Resilience](#error-handling--resilience)
16. [Database Schema](#database-schema)
17. [Security Considerations](#security-considerations)
18. [Configuration Reference](#configuration-reference)
19. [File Reference Map](#file-reference-map)

---

## Overview

Ticket Team implements a production-grade **Retrieval-Augmented Generation (RAG)** pipeline to power its AI assistant, **Timi**. Rather than relying on a general-purpose LLM with no institutional context, every AI response is grounded in La Verdad Christian College's (LVCC) knowledge base articles, ensuring accurate, verifiable, and contextually relevant answers to IT support queries.

### Why RAG?

| Approach | Pros | Cons |
|----------|------|------|
| **Pure LLM** | Simple to implement | Hallucinates, no institutional knowledge, can't cite sources |
| **Fine-tuned LLM** | Accurate for known topics | Expensive to train, stale data, hard to update |
| **RAG (our approach)** | Grounded answers, citable sources, easy to update, cost-effective | Requires vector infrastructure, quality depends on KB content |

**Key Decision:** RAG was chosen because it allows the knowledge base to be updated independently of the AI model, provides traceable citations for every response, and eliminates hallucination for questions covered by the KB. See [ADR-0004](../adr/0004-RAG-architecture.md) for the full decision record.

### Design Principles

1. **Grounded Responses** - Every answer must be traceable to knowledge base articles
2. **Real-Time Streaming** - Users see responses as they are generated (SSE)
3. **Graceful Degradation** - The system fails safely at every layer with user-friendly messages
4. **Multi-Layer Caching** - Embeddings, retrievals, and FAQ responses are cached independently
5. **Security First** - All AI operations are server-side only; API keys never reach the browser

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│  ┌──────────────┐    POST /api/v1/ai/chat     ┌──────────────────┐  │
│  │  ChatClient   │ ──────────────────────────► │   SSE Stream     │  │
│  │  Component    │ ◄─────────────────────────── │   Reader         │  │
│  │              │    data: {type, text, ...}    │                  │  │
│  └──────────────┘                               └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER (Next.js API Route)                       │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │   Auth    │  │  Rate    │  │   Input     │  │   AI Config      │ │
│  │   Check   │─►│  Limiter │─►│   Validation│─►│   Check          │ │
│  └──────────┘  └──────────┘  └─────────────┘  └──────────────────┘ │
│                                                        │             │
│                                                        ▼             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   RAG Pipeline (rag-service.ts)               │   │
│  │                                                               │   │
│  │  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐ │   │
│  │  │ Scope   │    │ Embed    │    │ Retrieve │    │ Build   │ │   │
│  │  │ Check   │───►│ Query    │───►│ Context  │───►│ Prompt  │ │   │
│  │  └─────────┘    └──────────┘    └──────────┘    └─────────┘ │   │
│  │                                                       │       │   │
│  │                                                       ▼       │   │
│  │  ┌─────────────────┐    ┌────────────┐    ┌──────────────┐   │   │
│  │  │ Extract         │◄───│  Stream    │◄───│  Generate    │   │   │
│  │  │ Citations       │    │  Chunks    │    │  Response    │   │   │
│  │  └─────────────────┘    └────────────┘    └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Post-Processing: Log Interaction → Generate Title → Close   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│                                                                      │
│  ┌──────────────────┐              ┌──────────────────────────────┐ │
│  │  Google Gemini    │              │  Supabase (PostgreSQL)       │ │
│  │                   │              │                              │ │
│  │  • gemini-        │              │  • knowledge_articles        │ │
│  │    embedding-001  │              │    (pgvector, HNSW index)    │ │
│  │    (768-dim)      │              │                              │ │
│  │                   │              │  • ai_interactions           │ │
│  │  • gemini-2.5-    │              │    (conversation log)        │ │
│  │    flash          │              │                              │ │
│  │    (generation)   │              │  • match_kb_articles()       │ │
│  │                   │              │    (RPC function)            │ │
│  └──────────────────┘              └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### File Architecture

The RAG system spans multiple layers of the application. Here is each module's responsibility:

| Layer | File | Responsibility |
|-------|------|----------------|
| **API Route** | `src/app/api/v1/ai/chat/route.ts` | HTTP endpoint, auth, rate limiting, SSE streaming |
| **RAG Orchestrator** | `src/lib/chat/rag-service.ts` | Full pipeline: retrieve → augment → generate |
| **AI Client** | `src/lib/ai/client.ts` | Gemini SDK wrapper, embeddings, chat generation |
| **Prompt Engineering** | `src/lib/chat/prompts.ts` | System instructions, context formatting, confidence |
| **Cache Service** | `src/lib/chat/cache-service.ts` | LRU caching for embeddings, retrievals, FAQs |
| **Rate Limiter** | `src/lib/chat/rate-limiter.ts` | Token bucket, circuit breaker, retry logic |
| **DB Queries** | `src/lib/chat/queries.ts` | Session management, interaction recording |
| **Error Tracking** | `src/lib/monitoring/error-tracking.ts` | Error classification and monitoring |
| **Chat UI** | `src/components/chat/chat-client.tsx` | Client-side streaming reader, UI state |
| **Sources Display** | `src/components/chat/chat-sources.tsx` | Citation and source article display |
| **DB Function** | `supabase/migrations/*_match_kb_articles.sql` | pgvector cosine similarity search |

---

## Complete Data Flow

This section walks through every step of a user query, from keystroke to displayed response.

### Step 1: User Sends Message

The user types a message in the `ChatClient` component (`src/components/chat/chat-client.tsx`). On submit:

1. The message is optimistically added to the UI
2. A `POST` request is sent to `/api/v1/ai/chat` with:
   ```json
   {
     "message": "How do I reset my email password?",
     "sessionId": "abc-123-def",
     "conversationHistory": [
       { "role": "user", "content": "Previous question..." },
       { "role": "assistant", "content": "Previous answer..." }
     ]
   }
   ```
3. The client opens a stream reader on the response body

### Step 2: Authentication & Rate Limiting

The API route (`src/app/api/v1/ai/chat/route.ts`) performs pre-flight checks:

1. **Authentication** - Verifies the user via `supabase.auth.getUser()` using the session cookie. Returns `401` if unauthenticated.
2. **Rate Limiting** - Calls `checkRateLimit(userId)` which uses a token bucket algorithm (10 req/min per user). Returns `429` with `Retry-After` header if exceeded.
3. **AI Configuration** - Checks that `GEMINI_API_KEY` is set via `isAIConfigured()`. Returns `503` if not configured.
4. **Input Validation** - Validates message exists, is a string, and is under 2,000 characters. Validates sessionId is present.

### Step 3: Scope Check

Before entering the RAG pipeline, the query is checked against `isQueryInScope()` in `src/lib/chat/prompts.ts`. Queries containing non-IT keywords (e.g., "homework", "tuition", "grades") are immediately returned with a polite redirect to the appropriate department, bypassing the entire retrieval pipeline.

### Step 4: Embedding Generation

The user's query is converted to a 768-dimensional vector:

1. **Cache Check** - `getCachedEmbedding(query)` checks the in-memory LRU cache (500 entries, 1-hour TTL)
2. **API Call** (on cache miss) - `generateEmbedding()` calls the Gemini API:
   - **Model:** `gemini-embedding-001`
   - **Task Type:** `RETRIEVAL_QUERY` (optimized for query similarity matching)
   - **Output Dimensionality:** 768 (matches the database column `vector(768)`)
3. **Cache Storage** - The embedding is cached with a normalized key (lowercased, trimmed, collapsed whitespace)
4. **Retry Logic** - Up to 3 retries with exponential backoff (1s → 2s → 4s max)

```
User Query: "How do I reset my email password?"
    ↓
gemini-embedding-001 (RETRIEVAL_QUERY, 768-dim)
    ↓
[0.0123, -0.0456, 0.0789, ..., 0.0321]  (768 floats)
```

### Step 5: Semantic Search (Retrieval)

The embedding vector is used to find relevant knowledge base articles:

1. **Cache Check** - `getCachedRetrieval(query, maxArticles, threshold)` checks the retrieval cache (200 entries, 5-min TTL)
2. **RPC Call** (on cache miss) - Executes the Supabase RPC function:
   ```sql
   SELECT * FROM match_kb_articles(
     query_embedding := [0.0123, -0.0456, ...],
     match_threshold := 0.7,
     match_count := 5,
     min_content_length := 50
   )
   ```
3. The PostgreSQL function:
   - Filters to `status = 'published'` articles with non-null embeddings
   - Computes cosine similarity: `1 - (embedding <=> query_embedding)`
   - Returns articles where `similarity > 0.7`, ordered by similarity descending
   - Uses the HNSW index (`vector_cosine_ops`) for efficient approximate nearest neighbor search
4. **Cache Storage** - Results are cached with a composite key (query + maxArticles + threshold)

### Step 6: Confidence Calculation

A confidence score is computed from the retrieval results:

```
confidence = min(avgSimilarity + countBonus, 1.0)

where:
  avgSimilarity = sum(article.similarity) / count(articles)
  countBonus = min(count(articles) / 5, 0.2)
```

- **0 articles found:** confidence = 0 (triggers graceful fallback)
- **1 article at 0.85 similarity:** confidence = 0.85 + 0.04 = 0.89
- **5 articles at 0.78 avg:** confidence = 0.78 + 0.20 = 0.98

### Step 7: Context Assembly (Augmentation)

The `buildRAGPrompt()` function assembles the final prompt:

```
**Previous Conversation:**        ← Last 10 messages (if multi-turn)

User: How do I connect to WiFi?
Assistant: To connect to the campus WiFi...

---

**Relevant Knowledge Base Articles:**   ← Retrieved articles with metadata

### [Password Reset Guide]
**Category:** Account
**Content:** To reset your LVCC email password, follow these steps...
**Relevance Score:** 92.3%

---

### [Email Troubleshooting]
**Category:** Email
**Content:** If you're having issues with your email account...
**Relevance Score:** 78.1%

---

**Current User Question:**
How do I reset my email password?

**Your Task:**
Answer the user's question using the knowledge base articles provided above.
Cite articles using [Article Title] format.
If the KB articles don't fully answer the question, acknowledge this and suggest next steps.
```

### Step 8: Response Generation

The augmented prompt is sent to Google Gemini for response generation:

- **Primary Model:** `gemini-2.5-flash`
- **Fallback Model:** `gemini-2.0-flash` (used when primary hits quota limits)
- **System Instruction:** The `CHAT_SYSTEM_INSTRUCTION` prompt defines the "Timi" persona with guidelines for grounded responses, citation format, escalation triggers, and response structure
- **Temperature:** 0.7 (balanced creativity and consistency)
- **Max Output Tokens:** 1,024
- **Top-P:** 0.9, **Top-K:** 40

The response is generated as a stream of text chunks.

### Step 9: Streaming to Client

Chunks are streamed using Server-Sent Events (SSE):

```
data: {"type":"context","contextArticles":[...],"confidence":0.89}

data: {"type":"content","text":"I can help you "}

data: {"type":"content","text":"reset your password! "}

data: {"type":"content","text":"Here's how:\n\n1. Go to..."}

...more content chunks...

data: {"type":"done","responseTimeMs":2340,"citations":["Password Reset Guide"],"shouldEscalate":false}

data: {"type":"interaction","interactionId":"uuid-here"}
```

### Step 10: Post-Processing

After the stream completes:

1. **Interaction Logging** - The full query, response, context article IDs, response time, confidence, and citations are recorded in the `ai_interactions` table
2. **Session Title Generation** (first message only) - An AI-generated title is created from the first message (e.g., "Password Reset Help"). Falls back to a truncated message if AI quota is exhausted.
3. **Citation Extraction** - `[Article Title]` patterns are extracted from the response and matched to article IDs

---

## Embedding Generation

### Model Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Model** | `gemini-embedding-001` | Google's latest embedding model with Matryoshka scaling |
| **Dimensions** | 768 | Matches the `vector(768)` column in PostgreSQL |
| **Max Dimensions** | 3,072 | Supports up to 3,072 with output dimensionality parameter |
| **Task Types** | `RETRIEVAL_QUERY`, `RETRIEVAL_DOCUMENT` | Asymmetric retrieval (query vs document embeddings) |

### Asymmetric Embedding Strategy

The system uses **asymmetric embeddings**, meaning queries and documents use different task types:

- **User queries** use `RETRIEVAL_QUERY` - optimized for matching against stored documents
- **KB articles** use `RETRIEVAL_DOCUMENT` - optimized for being retrieved by queries

This improves retrieval accuracy because the model learns to map questions to their answers rather than requiring exact text overlap.

### Implementation

```typescript
// Query embedding (for user questions)
const queryEmbedding = await generateEmbedding(userQuery, {
  taskType: 'RETRIEVAL_QUERY',
  outputDimensionality: 768,
})

// Document embedding (for KB articles during ingestion)
const docEmbedding = await generateDocumentEmbedding(articleContent)
// Internally uses taskType: 'RETRIEVAL_DOCUMENT'
```

**File:** `src/lib/ai/client.ts` — `generateEmbedding()`, `generateDocumentEmbedding()`

---

## Semantic Search (Retrieval)

### PostgreSQL Function: `match_kb_articles`

The core of the retrieval layer is a PostgreSQL function that performs vector similarity search using the pgvector extension:

```sql
CREATE OR REPLACE FUNCTION match_kb_articles(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  min_content_length int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  category text,
  subcategory text,
  tags text[],
  view_count int,
  helpful_votes int,
  total_votes int,
  similarity float,
  author_id uuid,
  author_full_name text,
  author_email text,
  author_avatar_url text
)
```

### How Similarity is Computed

```sql
1 - (knowledge_articles.embedding <=> query_embedding) AS similarity
```

- The `<=>` operator is pgvector's **cosine distance** operator
- Cosine distance ranges from 0 (identical) to 2 (opposite)
- Converting to similarity: `1 - distance` gives a range of -1 to 1
- In practice, similarity ranges from 0 to 1 for our normalized embeddings

### Index Configuration

```sql
CREATE INDEX idx_knowledge_articles_embedding
  ON knowledge_articles
  USING hnsw (embedding vector_cosine_ops);
```

- **Index Type:** HNSW (Hierarchical Navigable Small World)
- **Operator Class:** `vector_cosine_ops` (cosine similarity)
- **Why HNSW:** Provides the best query performance for approximate nearest neighbor (ANN) search. Faster than IVFFlat for our workload size, with minimal accuracy loss.

### Filtering Criteria

The function applies these filters before similarity computation:

1. `status = 'published'` — Only published articles are searchable
2. `embedding IS NOT NULL` — Skips articles that failed embedding generation
3. `LENGTH(content) >= min_content_length` — Filters out stubs (default: 50 chars)
4. `similarity > match_threshold` — Only returns articles above the similarity threshold (default: 0.7)

### Tuning Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `match_threshold` | 0.7 | Minimum similarity score (0-1). Lower = more results but less relevant |
| `match_count` | 5 | Maximum articles returned. Higher = more context but longer prompts |
| `min_content_length` | 50 | Minimum article content length. Filters stubs |

**File:** `supabase/migrations/20250122000001_update_match_kb_articles_with_author.sql`

---

## Context Assembly (Augmentation)

### Prompt Structure

The `buildRAGPrompt()` function in `src/lib/chat/prompts.ts` assembles a structured prompt with four sections:

#### 1. Conversation History (Optional)

If this is a multi-turn conversation, the last 10 messages are included:

```
**Previous Conversation:**

User: {previous question}
Assistant: {previous answer}

---
```

#### 2. Knowledge Base Articles

Each retrieved article is formatted with its title, category, content, and relevance score:

```
**Relevant Knowledge Base Articles:**

### [Article Title]
**Category:** {category}
**Content:**
{full article content}
**Relevance Score:** {similarity * 100}%

---
```

If no articles are found, a note is added instructing the model to provide general guidance and suggest creating a support ticket.

#### 3. Current User Question

```
**Current User Question:**
{the user's actual question}
```

#### 4. Task Instructions

```
**Your Task:**
Answer the user's question using the knowledge base articles provided above.
Cite articles using [Article Title] format.
If the KB articles don't fully answer the question, acknowledge this and suggest next steps.
```

### System Instruction (Timi Persona)

The `CHAT_SYSTEM_INSTRUCTION` constant defines the AI assistant's persona and behavior. Key directives:

- **Identity:** "Timi" - an AI-powered IT support assistant for LVCC
- **Grounding Rule:** ALWAYS base answers on provided KB articles; NEVER fabricate information
- **Citation Format:** Reference articles using `[Article Title]` at the end of relevant paragraphs
- **Tone:** Warm, friendly, professional; simple language avoiding jargon
- **Escalation Trigger:** Suggest ticket creation for hands-on support, security issues, or unresolved troubleshooting
- **Response Structure:** Brief direct answer → detailed steps → next steps → citations

**File:** `src/lib/chat/prompts.ts` — `CHAT_SYSTEM_INSTRUCTION`

---

## Response Generation

### Model Selection with Fallback

The system uses a **cascading model strategy** to handle quota exhaustion:

```
gemini-2.5-flash (primary)
    │
    │  If 429 / quota exhausted
    ▼
gemini-2.0-flash (fallback)
```

Each model has its own daily quota on Google's free tier, so switching models effectively doubles the available capacity.

### Generation Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Temperature** | 0.7 | Balanced creativity and consistency |
| **Max Output Tokens** | 1,024 | Sufficient for detailed IT support responses |
| **Top-P** | 0.9 | Nucleus sampling for diverse but coherent output |
| **Top-K** | 40 | Limits token selection to top 40 candidates |

### Retry Logic

The AI client wraps all API calls with retry logic:

- **Max Retries:** 3
- **Backoff:** Exponential (1s → 2s → 4s max)
- **Quota Errors (429):** NOT retried (daily limits won't reset mid-day)
- **Network/Timeout Errors:** Retried with backoff

**File:** `src/lib/ai/client.ts` — `generateChatStreamResponse()`, `withRetry()`

---

## Streaming Implementation

### Server-Side (SSE)

The API route creates a `ReadableStream` that yields Server-Sent Events:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    const ragStream = await streamRAGResponse({ query, conversationHistory })

    for await (const chunk of ragStream) {
      const data = `data: ${JSON.stringify(chunk)}\n\n`
      controller.enqueue(encoder.encode(data))

      // Yield to event loop for backpressure handling
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    controller.close()
  }
})

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',  // Disable nginx buffering
  }
})
```

### Stream Chunk Types

| Type | Payload | When Emitted |
|------|---------|--------------|
| `context` | `{ contextArticles, confidence }` | After retrieval, before generation |
| `content` | `{ text }` | During generation (multiple chunks) |
| `done` | `{ responseTimeMs, citations, shouldEscalate }` | After generation completes |
| `interaction` | `{ interactionId }` | After logging to database |
| `error` | `{ error }` | On any error at any stage |

### Client-Side Stream Reader

The `ChatClient` component reads the stream using the Fetch API:

```typescript
const response = await fetch('/api/v1/ai/chat', { method: 'POST', body, signal })
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  // Parse SSE lines: "data: {...}\n\n"
  // Update UI state based on chunk.type
}
```

### Abort Handling

Client disconnections are handled gracefully:

- The API route listens for `request.signal.abort`
- On abort, the stream loop breaks and resources are cleaned up
- No interaction is logged for aborted requests

**Files:** `src/app/api/v1/ai/chat/route.ts`, `src/components/chat/chat-client.tsx`

---

## Caching Layer

The RAG pipeline implements a three-tier in-memory caching strategy to minimize API calls and database queries.

### Cache Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Cache Hierarchy                         │
│                                                           │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Embedding Cache │  │  Retrieval   │  │  FAQ Cache  │ │
│  │                  │  │  Cache       │  │             │ │
│  │  500 entries     │  │  200 entries │  │  100 entries│ │
│  │  1 hour TTL      │  │  5 min TTL  │  │  10 min TTL │ │
│  │                  │  │             │  │             │ │
│  │  Key: normalized │  │  Key: query │  │  Key: query │ │
│  │  query text      │  │  + params   │  │  text       │ │
│  └─────────────────┘  └──────────────┘  └─────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Cache Specifications

| Cache | Max Size | TTL | Key Format | Stores |
|-------|----------|-----|------------|--------|
| **Embedding** | 500 entries | 1 hour | `emb:{normalized_query}` | 768-dim float arrays |
| **Retrieval** | 200 entries | 5 minutes | `ret:{normalized_query}:{maxArticles}:{threshold}` | Articles + confidence + hadResults |
| **FAQ** | 100 entries | 10 minutes | `faq:{normalized_query}` | Full response + citations + articles |

### Eviction Policy

All caches use **LRU (Least Recently Used)** eviction:

- When the cache is full, the least recently accessed entry is removed
- Access promotes an entry to the "most recently used" position
- Expired entries are evicted on access (lazy expiration)

### Cache Invalidation

When KB articles are created, updated, or deleted:

```typescript
invalidateKBCaches()
// Clears: retrieval cache + FAQ cache
// Keeps: embedding cache (query-based, not content-based)
```

The embedding cache is preserved because query embeddings don't change when KB content changes. Only retrieval results and cached FAQ responses become stale.

### Cache Statistics

Each cache tracks hit/miss statistics:

```typescript
getAllCacheStats()
// Returns: { embedding: { hits, misses, size, hitRate }, retrieval: {...}, faq: {...} }
```

**File:** `src/lib/chat/cache-service.ts`

---

## Rate Limiting & Circuit Breaker

### Token Bucket Rate Limiter

The system uses a **token bucket algorithm** to rate-limit chat requests per user:

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Max Tokens** | 10 | Burst capacity (requests before throttling) |
| **Refill Rate** | 10 tokens/min | Sustainable throughput |
| **Cost per Request** | 1 token | Each chat message costs 1 token |

**Behavior:**

1. Each user starts with 10 tokens
2. Each request consumes 1 token
3. Tokens refill at 10/minute
4. When tokens are exhausted, the user gets a `429` response with a `Retry-After` header
5. Rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) are included in every response

### Circuit Breaker

A circuit breaker protects the system when the Gemini API is failing repeatedly:

```
CLOSED (normal) ──[5 failures]──► OPEN (blocked)
                                      │
                                  [1 min timeout]
                                      │
                                      ▼
                                 HALF-OPEN (test)
                                      │
                              ┌───────┴───────┐
                         [success]         [failure]
                              │                │
                              ▼                ▼
                           CLOSED            OPEN
```

| Parameter | Value |
|-----------|-------|
| **Failure Threshold** | 5 consecutive failures to open |
| **Timeout** | 60 seconds before allowing test request |
| **Half-Open Requests** | 1 request allowed to test recovery |

### Exponential Backoff (Retry)

For transient errors, the system retries with exponential backoff:

- **Max Retries:** 3
- **Initial Delay:** 1,000ms
- **Max Delay:** 10,000ms
- **Backoff Multiplier:** 2x
- **Retryable Errors:** Network errors, timeouts, 503/504, rate limits
- **Non-Retryable:** 429 quota exhausted (daily limits), safety blocks, model not found

**File:** `src/lib/chat/rate-limiter.ts`

---

## Citation Handling

### Extraction

After the full response is assembled, citations are extracted using regex:

```typescript
const citationRegex = /\[([^\]]+)\]/g
```

**Filters applied:**
- Citation text must be 3-100 characters
- Must not contain URLs (`http`)
- Duplicates are removed

### Matching

Extracted citation titles are fuzzy-matched to retrieved article IDs:

```typescript
// Case-insensitive substring matching in both directions
article.title.toLowerCase().includes(citation.toLowerCase()) ||
citation.toLowerCase().includes(article.title.toLowerCase())
```

### Display

The `ChatSources` component renders cited articles with:
- Article title (linked to the KB article page)
- Similarity score as a percentage
- Category metadata

**Files:** `src/lib/chat/rag-service.ts` — `extractCitations()`, `matchCitationsToArticles()`; `src/components/chat/chat-sources.tsx`

---

## Conversation History

### Storage

Each user-assistant exchange is stored in the `ai_interactions` table:

- `session_id` groups messages into conversations
- `query` and `response` store the full text
- `context_articles` stores referenced article UUIDs
- `metadata` stores confidence, citations, and model info

### Context Window

For multi-turn conversations, the last **10 messages** are included in the prompt:

```typescript
conversationHistory.slice(-10)
```

This provides sufficient context for follow-up questions without exceeding the model's context window or inflating costs.

### Session Lifecycle

1. **Creation** - A new session ID is generated client-side when the user starts a chat
2. **Title Generation** - After the first message, an AI-generated title is saved (e.g., "Password Reset Help")
3. **Active Use** - Messages are streamed and logged under the session ID
4. **Archival** - Sessions can be archived via `archiveSession()` (soft delete with `archived_at` timestamp)

**Files:** `src/lib/chat/queries.ts`, `src/app/actions/chat.ts`

---

## Escalation Detection

The system automatically suggests escalation to a human-managed support ticket when:

| Condition | Threshold | Rationale |
|-----------|-----------|-----------|
| **Low confidence** | confidence < 0.5 | KB doesn't have relevant articles for this issue |
| **Long conversation** | > 6 messages | Issue likely isn't being resolved through chat |

### Escalation Flow

1. `shouldSuggestEscalation()` evaluates confidence and conversation length
2. The `shouldEscalate` flag is sent in the `done` stream chunk
3. The client UI shows a "Create Support Ticket" button
4. Ticket creation is a two-step process:
   - **Prepare** - AI extracts title, summary, category, and priority from the conversation
   - **Create** - User reviews and submits the pre-filled ticket

### AI-Assisted Ticket Extraction

When escalating, the `TICKET_EXTRACTION_PROMPT` is used to generate structured ticket data:

```json
{
  "title": "Email Password Reset Not Working",
  "summary": "User has tried the standard password reset flow but is not receiving the reset email...",
  "category": "Account",
  "priority": "Medium"
}
```

**Files:** `src/lib/chat/prompts.ts` — `shouldSuggestEscalation()`, `ESCALATION_DETECTION_PROMPT`, `TICKET_EXTRACTION_PROMPT`; `src/app/actions/chat.ts`

---

## Error Handling & Resilience

The RAG pipeline implements defense-in-depth error handling at every stage:

### Error Classification

| Stage | Error Type | User Message | Retry? |
|-------|-----------|--------------|--------|
| **Embedding** | API failure | "Having trouble processing your question" | Yes (3x) |
| **Retrieval** | DB query failure | "Having trouble accessing the knowledge base" | No |
| **Generation** | Quota exhausted (429) | "High demand. Please try again in X seconds." | No (model fallback) |
| **Generation** | Safety filter triggered | "I can't provide an answer to that. Please create a ticket." | No |
| **Generation** | Network error | "Connection lost. Please check your internet." | Yes (3x) |
| **Generation** | Model not found | "AI model temporarily unavailable." | No |
| **Any** | Unknown error | "Having trouble generating a response. Please try again." | No |

### Graceful Degradation Hierarchy

```
1. Primary model (gemini-2.5-flash)
   ↓ quota exhausted
2. Fallback model (gemini-2.0-flash)
   ↓ also exhausted
3. User-friendly error message with retry delay
   ↓ persistent failures
4. Circuit breaker opens → immediate "service unavailable" for 60s
   ↓ after timeout
5. Half-open → test one request → close circuit if success
```

### KB Article Embedding Failures

When generating embeddings for KB articles during creation/update:

- The article is saved **without** an embedding
- A warning is logged
- The article won't appear in semantic search results but remains browsable
- The embedding can be regenerated later via the ingestion pipeline

**Files:** `src/lib/ai/client.ts`, `src/lib/chat/rag-service.ts`, `src/lib/chat/rate-limiter.ts`

---

## Database Schema

### `knowledge_articles` Table

```sql
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  author_id UUID NOT NULL REFERENCES users(id),
  status article_status NOT NULL DEFAULT 'draft',  -- 'draft' | 'published' | 'archived'
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_votes INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  embedding vector(768),          -- pgvector column for Gemini embeddings
  search_vector tsvector,         -- Full-text search (generated column)
  source_ticket_id UUID REFERENCES tickets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  CONSTRAINT title_length CHECK (LENGTH(title) >= 5),
  CONSTRAINT content_length CHECK (LENGTH(content) >= 20),
  CONSTRAINT category_not_empty CHECK (LENGTH(category) > 0),
  CONSTRAINT valid_vote_counts CHECK (helpful_votes >= 0 AND total_votes >= 0)
);
```

**Key Indexes:**
- `idx_knowledge_articles_embedding` — HNSW index for vector similarity search
- `idx_knowledge_articles_search_vector` — GIN index for full-text keyword search
- `idx_knowledge_articles_status` — B-tree for status filtering
- `idx_knowledge_articles_category` — B-tree for category/subcategory filtering
- `idx_knowledge_articles_published_at` — Partial index on published articles

### `ai_interactions` Table

```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  context_articles UUID[] DEFAULT '{}'::uuid[],
  was_helpful BOOLEAN,
  escalated_to_ticket BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_id UUID REFERENCES tickets(id),
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT session_id_not_empty CHECK (LENGTH(session_id) > 0),
  CONSTRAINT query_not_empty CHECK (LENGTH(query) > 0),
  CONSTRAINT response_not_empty CHECK (LENGTH(response) > 0)
);
```

**Key Indexes:**
- `idx_ai_interactions_session_id` — For retrieving conversation history
- `idx_ai_interactions_user_id` — For user's interaction history
- `idx_ai_interactions_created_at` — For chronological queries
- `idx_ai_interactions_escalated` — Partial index on escalated interactions

### Row Level Security (RLS)

| Table | Operation | Policy |
|-------|-----------|--------|
| `knowledge_articles` | SELECT | Published articles are readable by all authenticated users; drafts only by staff/admin |
| `knowledge_articles` | INSERT | Only staff, admin, and super_admin (must be own author_id) |
| `knowledge_articles` | UPDATE | Author or admin/super_admin |
| `knowledge_articles` | DELETE | Admin and super_admin only |
| `ai_interactions` | SELECT | Own interactions or staff/admin/super_admin |
| `ai_interactions` | INSERT | Own user_id or null |
| `ai_interactions` | UPDATE | Own user_id only |

---

## Security Considerations

### Server-Side Only Architecture

All AI operations run exclusively on the server:

- **Embedding generation** → Server Action / API Route
- **Semantic search** → Server-side Supabase RPC
- **Response generation** → Server-side Gemini API call
- **API keys** → Only accessible via `serverEnv` (throws if imported in client code)

### Secret Protection Layers

1. **Runtime:** `@/lib/env/server` throws an error if imported in browser code
2. **Build-Time:** `npm run check-bundle-security` scans client bundles for exposed secrets
3. **ESLint:** Rules prevent importing deprecated unified env module
4. **RLS:** All database access respects Row Level Security policies

### Input Validation

- Message length limit: 2,000 characters
- Session ID required and validated
- Query scope checking prevents off-topic abuse
- Rate limiting prevents API abuse (10 req/min per user)

### Data Privacy

- AI interactions are scoped to the authenticated user via RLS
- Users can only view their own conversation history
- Staff/admins can view all interactions for support purposes
- The `was_helpful` feedback flag is optional and user-controlled

---

## Configuration Reference

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Server only | Google Gemini API authentication |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS (used sparingly) |

### RAG Configuration Constants

| Constant | Value | File |
|----------|-------|------|
| `SIMILARITY_THRESHOLD` | 0.7 | `src/lib/chat/rag-service.ts` |
| `MAX_ARTICLES` | 5 | `src/lib/chat/rag-service.ts` |
| `MIN_CONFIDENCE_FOR_RESPONSE` | 0.3 | `src/lib/chat/rag-service.ts` |
| `EMBEDDING_OUTPUT_DIMENSIONALITY` | 768 | `src/lib/ai/client.ts` |
| `MAX_RETRIES` | 3 | `src/lib/ai/client.ts` |
| `RATE_LIMIT_MAX_TOKENS` | 10 | `src/lib/chat/rate-limiter.ts` |
| `RATE_LIMIT_REFILL_RATE` | 10/min | `src/lib/chat/rate-limiter.ts` |
| `CIRCUIT_BREAKER_THRESHOLD` | 5 failures | `src/lib/chat/rate-limiter.ts` |
| `CIRCUIT_BREAKER_TIMEOUT` | 60s | `src/lib/chat/rate-limiter.ts` |
| `MAX_MESSAGE_LENGTH` | 2,000 chars | `src/app/api/v1/ai/chat/route.ts` |
| `MAX_CONVERSATION_HISTORY` | 10 messages | `src/lib/chat/prompts.ts` |
| `SESSION_TITLE_MAX_LENGTH` | 60 chars | `src/app/api/v1/ai/chat/route.ts` |

---

## File Reference Map

A complete map of every file involved in the RAG architecture:

### Core Pipeline

| File | Purpose |
|------|---------|
| `src/app/api/v1/ai/chat/route.ts` | Main chat API endpoint with SSE streaming |
| `src/lib/chat/rag-service.ts` | RAG orchestrator (retrieve → augment → generate) |
| `src/lib/ai/client.ts` | Gemini SDK wrapper (embeddings + generation) |
| `src/lib/chat/prompts.ts` | System instructions and prompt building |
| `src/lib/chat/cache-service.ts` | Three-tier LRU caching |
| `src/lib/chat/rate-limiter.ts` | Token bucket + circuit breaker + retry |
| `src/lib/chat/queries.ts` | Database queries for sessions and interactions |

### Supporting Services

| File | Purpose |
|------|---------|
| `src/lib/ai/retrieval.ts` | KB search, AI event search, combined search |
| `src/lib/ai/context-builder.ts` | Context string formatting for RAG prompts |
| `src/lib/ai/ingestion.ts` | Batch embedding generation for AI events |
| `src/lib/monitoring/error-tracking.ts` | Error classification and streaming error tracking |
| `src/lib/env/server.ts` | Server-only environment variable access |

### Server Actions

| File | Purpose |
|------|---------|
| `src/app/actions/chat.ts` | Session CRUD, feedback, ticket escalation |
| `src/app/actions/assistant.ts` | Non-streaming RAG for assistant panel |
| `src/lib/kb/actions.ts` | KB article CRUD with auto-embedding |

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/v1/ai/chat/route.ts` | Streaming chat endpoint |
| `src/app/api/kb/semantic-search/route.ts` | Standalone KB semantic search |
| `src/app/api/ai/ingest/route.ts` | Embedding ingestion pipeline |
| `src/app/api/ai/events/route.ts` | AI event collection |

### Client Components

| File | Purpose |
|------|---------|
| `src/components/chat/chat-client.tsx` | Main chat UI with stream reader |
| `src/components/chat/chat-message.tsx` | Individual message rendering |
| `src/components/chat/chat-input.tsx` | Message input handling |
| `src/components/chat/chat-sources.tsx` | Source citation display |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/20250114000002_create_core_tables.sql` | Table definitions |
| `supabase/migrations/20250114000003_create_indexes.sql` | HNSW + B-tree indexes |
| `supabase/migrations/20250114000004_create_rls_policies.sql` | RLS policies |
| `supabase/migrations/20250115000001_fix_embedding_dimension.sql` | Embedding column fix (768-dim) |
| `supabase/migrations/20250122000001_update_match_kb_articles_with_author.sql` | Semantic search function |
| `supabase/migrations/20260115000001_add_kb_full_text_search.sql` | Full-text search column |

---

*Last updated: February 2026*