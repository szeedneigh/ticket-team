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
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env/server'
import { requireAuth } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate - only authenticated users can search
    await requireAuth()

    // 2. Parse and validate request body
    const body = await request.json()
    const { query, threshold = 0.7, limit = 10 } = body

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
    const genAI = new GoogleGenerativeAI(serverEnv.gemini.apiKey)
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

    const embeddingResult = await model.embedContent(query)
    const queryEmbedding = embeddingResult.embedding.values

    // 4. Perform semantic search via pgvector
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('match_kb_articles', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) {
      console.error('Semantic search database error:', error)
      throw error
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
    console.error('Semantic search error:', error)

    // Differentiate between different error types
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('auth')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Semantic search failed. Please try again later.' },
      { status: 500 }
    )
  }
}
