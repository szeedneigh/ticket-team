/**
 * Semantic Search API Route
 *
 * POST /api/kb/semantic-search
 *
 * Performs semantic search using Gemini embeddings + pgvector.
 * Finds articles based on meaning/context, not just keyword matching.
 *
 * Body: { query: string, threshold?: number, limit?: number }
 * Returns: { query: string, results: Article[], count: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { generateEmbedding, isQuotaExhaustedError } from '@/lib/ai/client'

/** Must match `knowledge_articles.embedding` and `match_kb_articles` (vector(768)). */
const EMBEDDING_DIMENSION = 768

/** Machine-readable codes for clients (no secrets in responses). */
export type SemanticSearchErrorCode =
  | 'UNAUTHORIZED'
  | 'EMBEDDING_CONFIG'
  | 'EMBEDDING_QUOTA'
  | 'EMBEDDING_UNAVAILABLE'
  | 'EMBEDDING_DIMENSION_MISMATCH'
  | 'DATABASE_RPC'
  | 'UNKNOWN'

function embeddingErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (lower.includes('gemini_api_key') || lower.includes('not configured')) {
    console.error('[semantic-search] Embedding config:', message)
    return NextResponse.json(
      {
        error: 'Article suggestions are not configured on the server. Contact your administrator.',
        code: 'EMBEDDING_CONFIG' satisfies SemanticSearchErrorCode,
      },
      { status: 503 }
    )
  }

  if (isQuotaExhaustedError(error)) {
    console.error('[semantic-search] Embedding quota/rate limit:', message)
    return NextResponse.json(
      {
        error:
          'Suggestions are temporarily unavailable due to high demand. Please try again in a few minutes.',
        code: 'EMBEDDING_QUOTA' satisfies SemanticSearchErrorCode,
      },
      { status: 503 }
    )
  }

  if (lower.includes('network') || lower.includes('enotfound') || lower.includes('econn')) {
    console.error('[semantic-search] Embedding network:', message)
    return NextResponse.json(
      {
        error: 'Could not reach the AI service. Check your connection and try again.',
        code: 'EMBEDDING_UNAVAILABLE' satisfies SemanticSearchErrorCode,
      },
      { status: 503 }
    )
  }

  console.error('[semantic-search] Embedding failed:', message)
  return NextResponse.json(
    {
      error: 'Could not prepare article suggestions. Please try again.',
      code: 'EMBEDDING_UNAVAILABLE' satisfies SemanticSearchErrorCode,
    },
    { status: 503 }
  )
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate (JSON 401; avoid requireAuth/redirect — its throw is caught below as 500)
    if (!(await getUser())) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED' satisfies SemanticSearchErrorCode,
        },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 })
    }

    const { query, threshold = 0.7, limit = 10 } = body as {
      query?: unknown
      threshold?: unknown
      limit?: unknown
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query must not exceed 500 characters' },
        { status: 400 }
      )
    }

    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 1' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      )
    }

    // 3. Generate embedding for the search query using Gemini
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateEmbedding(query, {
        taskType: 'RETRIEVAL_QUERY',
      })
    } catch (embedError) {
      return embeddingErrorResponse(embedError)
    }

    if (queryEmbedding.length !== EMBEDDING_DIMENSION) {
      console.error('[semantic-search] Wrong embedding length', {
        expected: EMBEDDING_DIMENSION,
        actual: queryEmbedding.length,
      })
      return NextResponse.json(
        {
          error:
            'Search is misconfigured (embedding size does not match the database). Contact your administrator.',
          code: 'EMBEDDING_DIMENSION_MISMATCH' satisfies SemanticSearchErrorCode,
        },
        { status: 503 }
      )
    }

    // 4. Semantic search via pgvector — service role so EXECUTE on match_kb_articles is reliable
    // (authenticated role often lacks GRANT on this RPC). User is already verified above; SQL still
    // restricts to published rows only.
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('match_kb_articles', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      console.error('[semantic-search] match_kb_articles RPC failed', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      if (
        msg.includes('dimension') ||
        msg.includes('different vector dimensions') ||
        msg.includes('expected') && msg.includes('768')
      ) {
        return NextResponse.json(
          {
            error:
              'Knowledge base vectors do not match the embedding model. Ensure the database uses 768-dimensional embeddings.',
            code: 'EMBEDDING_DIMENSION_MISMATCH' satisfies SemanticSearchErrorCode,
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        {
          error: 'Could not search the knowledge base. Please try again later.',
          code: 'DATABASE_RPC' satisfies SemanticSearchErrorCode,
        },
        { status: 500 }
      )
    }

    // 5. Map database fields to frontend expected format
    interface KBArticleResult {
      id: string
      title: string
      content: string
      summary?: string
      category?: string
      subcategory?: string
      tags?: string[]
      view_count?: number
      helpful_votes?: number
      total_votes?: number
      similarity: number
      author_id?: string
      author_full_name?: string
      author_email?: string
      author_avatar_url?: string
    }
    
    const mappedResults = ((data as KBArticleResult[] | null) || []).map((article: KBArticleResult) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      category: article.category,
      subcategory: article.subcategory,
      tags: article.tags,
      view_count: article.view_count,
      helpful_votes: article.helpful_votes,
      total_votes: article.total_votes,
      similarity: article.similarity,
      // Map author fields (new fields from migration)
      author_id: article.author_id,
      author_full_name: article.author_full_name,
      author_email: article.author_email,
      author_avatar_url: article.author_avatar_url
    }))

    // 6. Return results with metadata
    return NextResponse.json({
      query,
      results: mappedResults,
      count: mappedResults.length,
      threshold,
      limit
    })

  } catch (error) {
    console.error('[semantic-search] Unexpected error:', error)

    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('unauthorized') || msg.includes('auth')) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            code: 'UNAUTHORIZED' satisfies SemanticSearchErrorCode,
          },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Semantic search failed. Please try again later.',
        code: 'UNKNOWN' satisfies SemanticSearchErrorCode,
      },
      { status: 500 }
    )
  }
}
