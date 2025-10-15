/**
 * Knowledge Base Domain Types
 * 
 * Type definitions for knowledge articles, votes, and semantic search
 */

import type { ArticleStatus } from './database'
import type { User } from './users'

// ============================================================================
// Knowledge Article Types
// ============================================================================

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  summary: string | null
  category: string
  subcategory: string | null
  tags: string[]
  author_id: string
  status: ArticleStatus
  view_count: number
  helpful_votes: number
  total_votes: number
  embedding: number[] | null // vector(1536)
  source_ticket_id: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

// Article with author information
export interface KnowledgeArticleWithAuthor extends KnowledgeArticle {
  author: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

// Article with vote information
export interface KnowledgeArticleWithVote extends KnowledgeArticle {
  user_vote: ArticleVote | null
  helpfulness_rate: number // percentage
}

// ============================================================================
// Article Vote Types
// ============================================================================

export interface ArticleVote {
  id: string
  article_id: string
  user_id: string
  is_helpful: boolean
  feedback_text: string | null
  created_at: string
}

// ============================================================================
// Create/Update Types
// ============================================================================

export interface CreateArticleData {
  title: string
  content: string
  summary?: string
  category: string
  subcategory?: string
  tags?: string[]
  source_ticket_id?: string
  status?: ArticleStatus
}

export interface UpdateArticleData {
  title?: string
  content?: string
  summary?: string
  category?: string
  subcategory?: string
  tags?: string[]
  status?: ArticleStatus
}

export interface CreateVoteData {
  article_id: string
  is_helpful: boolean
  feedback_text?: string
}

// ============================================================================
// Search Types
// ============================================================================

export interface ArticleSearchFilters {
  status?: ArticleStatus
  category?: string
  tags?: string[]
  author_id?: string
  search?: string // full-text search
}

export interface ArticleSemanticSearchParams {
  query: string
  match_threshold?: number // 0-1, default 0.78
  match_count?: number // default 10
  min_content_length?: number // default 50
}

export interface ArticleSearchResult extends KnowledgeArticle {
  similarity?: number // cosine similarity score
  rank?: number
}

export interface ArticleListResponse {
  articles: KnowledgeArticleWithAuthor[]
  total: number
  page: number
  per_page: number
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ArticleStats {
  total: number
  published: number
  draft: number
  archived: number
  total_views: number
  avg_helpfulness_rate: number
  most_viewed: KnowledgeArticle[]
  most_helpful: KnowledgeArticle[]
}

export interface ArticleCategoryStats {
  category: string
  count: number
  avg_helpfulness: number
}

