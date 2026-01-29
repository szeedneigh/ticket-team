/**
 * Knowledge Base Queries
 *
 * Server-side data fetching functions for KB articles.
 * All functions use Supabase server client with RLS enabled.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  KnowledgeArticleListItemWithAuthor,
  KnowledgeArticleWithAuthor,
  ArticleSearchFilters,
  ArticleListResponse,
  ArticleVote
} from '@/lib/types/knowledge-base'
import { PAGINATION } from '@/lib/constants'

// ============================================================================
// Article List Queries
// ============================================================================

type AuthorPick = KnowledgeArticleListItemWithAuthor['author']

const UNKNOWN_AUTHOR: AuthorPick = {
  id: 'unknown',
  full_name: 'Unknown',
  email: '',
  avatar_url: null,
  position: null,
  role: 'employee'
}

function normalizeAuthor(author: unknown): AuthorPick {
  if (!author) return UNKNOWN_AUTHOR
  if (Array.isArray(author)) return (author[0] as AuthorPick | undefined) ?? UNKNOWN_AUTHOR
  return author as AuthorPick
}

/**
 * Get paginated KB articles with filters and sorting
 * Used by: Browse page (/kb)
 *
 * @param filters - Search filters (status, category, tags, search)
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page (default: 20)
 * @param sortBy - Sort order: 'recent', 'popular', 'helpful'
 * @returns Paginated article list with total count
 */
export async function getArticles(
  filters: ArticleSearchFilters = {},
  page: number = 1,
  perPage: number = PAGINATION.DEFAULT_PAGE_SIZE,
  sortBy: 'recent' | 'popular' | 'helpful' = 'recent'
): Promise<ArticleListResponse> {
  const supabase = await createClient()
  const offset = (page - 1) * perPage

  let query = supabase
    .from('knowledge_articles')
    .select(
      `
      id,
      title,
      summary,
      category,
      subcategory,
      tags,
      author_id,
      status,
      view_count,
      helpful_votes,
      total_votes,
      created_at,
      updated_at,
      published_at,
      author:users!author_id (
        id,
        full_name,
        email,
        avatar_url,
        position,
        role
      )
    `,
      { count: 'exact' }
    )

  // Apply status filter (default: published only)
  if (filters.status) {
    query = query.eq('status', filters.status)
  } else {
    // Default: only show published articles
    query = query.eq('status', 'published')
  }

  // Apply category filter
  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  // Apply tag filter (contains any of the specified tags)
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }

  // Apply author filter
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id)
  }

  // Apply full-text search (title or content)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim()
    // Use Postgres full-text search via generated `search_vector` + GIN index.
    // This is dramatically faster than ILIKE scanning large `content`.
    query = query.textSearch('search_vector', searchTerm, {
      type: 'websearch',
      config: 'english',
    })
  }

  // Apply sorting
  switch (sortBy) {
    case 'popular':
      query = query.order('view_count', { ascending: false })
      break
    case 'helpful':
      // Sort by helpfulness percentage (calculated client-side), fallback to total votes
      query = query.order('helpful_votes', { ascending: false })
      query = query.order('total_votes', { ascending: false })
      break
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(offset, offset + perPage - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    throw new Error('Failed to fetch articles')
  }

  type ArticleRow = Omit<KnowledgeArticleListItemWithAuthor, 'author'> & {
    author?: unknown
  }

  const articles: KnowledgeArticleListItemWithAuthor[] = (data ?? []).map((row) => {
    const r = row as ArticleRow
    return {
      ...r,
      author: normalizeAuthor(r.author)
    }
  })

  return {
    articles,
    total: count || 0,
    page,
    per_page: perPage
  }
}

// ============================================================================
// Single Article Queries
// ============================================================================

/**
 * Get single article by ID with author info
 * Used by: Article detail page (/kb/[id])
 *
 * @param id - Article UUID
 * @returns Article with author information
 * @throws Error if article not found or user doesn't have access
 */
export async function getArticleById(
  id: string
): Promise<KnowledgeArticleWithAuthor> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(
      `
      *,
      author:users!author_id (
        id,
        full_name,
        email,
        avatar_url,
        position,
        role
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching article:', error)
    throw new Error('Failed to fetch article')
  }

  if (!data) {
    throw new Error('Article not found')
  }

  // Increment view count asynchronously (fire and forget)
  // Don't await to avoid blocking the response
  supabase
    .from('knowledge_articles')
    .update({ view_count: data.view_count + 1 })
    .eq('id', id)
    .then()

  return data as KnowledgeArticleWithAuthor
}

/**
 * Get user's vote on an article
 * Used by: Article detail page (to show existing vote state)
 *
 * @param articleId - Article UUID
 * @param userId - User UUID
 * @returns User's vote or null if no vote exists
 */
export async function getUserVote(
  articleId: string,
  userId: string
): Promise<ArticleVote | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('article_votes')
    .select('*')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user vote:', error)
    return null
  }

  return data
}

// ============================================================================
// Filter Data Queries
// ============================================================================

/**
 * Get all unique categories with their subcategories
 * Used by: Category filter dropdown
 *
 * @returns Array of categories with subcategories
 */
export async function getCategories(): Promise<
  { category: string; subcategories: string[] }[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('category, subcategory')
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Group by category and collect subcategories
  const categoryMap = new Map<string, Set<string>>()

  data?.forEach(({ category, subcategory }) => {
    if (!categoryMap.has(category)) {
      categoryMap.set(category, new Set())
    }
    if (subcategory) {
      categoryMap.get(category)?.add(subcategory)
    }
  })

  return Array.from(categoryMap.entries()).map(([category, subcategories]) => ({
    category,
    subcategories: Array.from(subcategories).sort()
  }))
}

/**
 * Get all unique tags from published articles
 * Used by: Tag filter, tag autocomplete
 *
 * @returns Sorted array of unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('tags')
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  // Flatten and deduplicate tags
  const allTags = new Set<string>()
  data?.forEach(({ tags }) => {
    tags.forEach((tag: string) => allTags.add(tag))
  })

  return Array.from(allTags).sort()
}

// ============================================================================
// Related Articles Query
// ============================================================================

/**
 * Get related articles using semantic similarity
 * Used by: Article detail page (related articles section)
 *
 * @param articleId - Current article UUID
 * @param limit - Number of related articles to return (default: 5)
 * @returns Array of related articles
 */
export async function getRelatedArticles(
  articleId: string,
  limit: number = 5
): Promise<Partial<KnowledgeArticleWithAuthor>[]> {
  const supabase = await createClient()

  // First, get the current article's embedding and category
  const { data: article, error: articleError } = await supabase
    .from('knowledge_articles')
    .select('embedding, category')
    .eq('id', articleId)
    .single()

  if (articleError || !article) {
    console.error('Error fetching article for related search:', articleError)
    // Fallback: return empty array
    return []
  }

  // If embedding exists, use semantic search
  if (article.embedding) {
    try {
      const { data, error } = await supabase.rpc('match_kb_articles', {
        query_embedding: article.embedding,
        match_threshold: 0.7,
        match_count: limit + 1 // +1 because current article will be in results
      })

      if (!error && data) {
        // Filter out current article and limit results
        return data.filter((a: { id: string }) => a.id !== articleId).slice(0, limit)
      }
    } catch (error) {
      console.error('Semantic search failed:', error)
      // Fall through to category-based fallback
    }
  }

  // Fallback: Return articles from same category
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(
      `
      id,
      title,
      summary,
      category,
      subcategory,
      view_count,
      helpful_votes,
      total_votes
    `
    )
    .eq('status', 'published')
    .eq('category', article.category)
    .neq('id', articleId)
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related articles by category:', error)
    return []
  }

  return data || []
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a user can edit an article
 * Used by: Article detail page (show/hide edit button)
 *
 * @param articleId - Article UUID
 * @param userId - User UUID
 * @param userRole - User's role
 * @returns true if user can edit, false otherwise
 */
export async function canUserEditArticle(
  articleId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  // Admins and super_admins can edit any article
  if (userRole === 'admin' || userRole === 'super_admin') {
    return true
  }

  // Staff can only edit their own articles
  if (userRole === 'staff') {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('author_id')
      .eq('id', articleId)
      .single()

    if (error || !data) {
      return false
    }

    return data.author_id === userId
  }

  // Employees cannot edit articles
  return false
}
