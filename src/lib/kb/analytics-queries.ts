/**
 * Knowledge Base Analytics Queries
 *
 * Server-side data fetching functions for KB analytics dashboard.
 * Provides statistics, charts data, and top articles.
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// Types
// ============================================================================

export interface ArticleStats {
  total: number
  published: number
  draft: number
  archived: number
  total_views: number
  avg_helpfulness_rate: number
}

export interface CategoryDistribution {
  category: string
  count: number
  percentage: number
  [key: string]: string | number
}

export interface TopArticle {
  id: string
  title: string
  category: string
  view_count: number
  helpful_votes: number
  total_votes: number
  helpfulness_rate: number
  published_at: string | null
  author: {
    full_name: string
    avatar_url: string | null
  }
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get KB overview statistics
 * Used by: Analytics dashboard stats cards
 */
export async function getKBAnalyticsStats(): Promise<ArticleStats> {
  const supabase = await createClient()

  // Parallel queries for performance
  const [
    { count: totalCount },
    { data: statusData },
    { data: viewData },
    { data: voteData }
  ] = await Promise.all([
    supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('knowledge_articles')
      .select('status'),

    supabase
      .from('knowledge_articles')
      .select('view_count'),

    supabase
      .from('knowledge_articles')
      .select('helpful_votes, total_votes')
      .gt('total_votes', 0)
  ])

  // Calculate metrics
  const published = statusData?.filter(a => a.status === 'published').length || 0
  const draft = statusData?.filter(a => a.status === 'draft').length || 0
  const archived = statusData?.filter(a => a.status === 'archived').length || 0

  const totalViews = viewData?.reduce((sum, a) => sum + a.view_count, 0) || 0

  const avgHelpfulness = voteData?.length
    ? (voteData.reduce((sum, a) => sum + (a.helpful_votes / a.total_votes), 0) / voteData.length) * 100
    : 0

  return {
    total: totalCount || 0,
    published,
    draft,
    archived,
    total_views: totalViews,
    avg_helpfulness_rate: Math.round(avgHelpfulness)
  }
}

/**
 * Get views over time (daily aggregation for last N days)
 * Used by: Line chart
 */
export async function getViewsOverTime(days: number = 30) {
  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('created_at, view_count, published_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by date
  const viewsByDate = new Map<string, number>()

  data?.forEach(article => {
    const date = new Date(article.created_at).toISOString().split('T')[0]
    viewsByDate.set(date, (viewsByDate.get(date) || 0) + article.view_count)
  })

  // Fill in missing dates with 0
  const result = []
  const currentDate = new Date(startDate)
  const endDate = new Date()

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      views: viewsByDate.get(dateStr) || 0
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

/**
 * Get category distribution
 * Used by: Pie chart
 */
export async function getCategoryDistribution(): Promise<CategoryDistribution[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('category')
    .eq('status', 'published')

  if (error) throw error

  const counts = data?.reduce((acc, { category }) => {
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = data?.length || 0

  return Object.entries(counts || {}).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / total) * 100)
  }))
}

/**
 * Get top articles by views
 * Used by: Bar chart, data table
 */
export async function getTopArticles(limit: number = 10): Promise<TopArticle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(`
      id,
      title,
      category,
      view_count,
      helpful_votes,
      total_votes,
      published_at,
      author:users!author_id (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(article => ({
    ...article,
    helpfulness_rate: article.total_votes > 0
      ? Math.round((article.helpful_votes / article.total_votes) * 100)
      : 0,
    author: Array.isArray(article.author) ? article.author[0] : article.author
  }))
}

/**
 * Get most helpful articles
 * Used by: Data table
 */
export async function getMostHelpfulArticles(limit: number = 10): Promise<TopArticle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(`
      id,
      title,
      category,
      view_count,
      helpful_votes,
      total_votes,
      published_at,
      author:users!author_id (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .gt('total_votes', 0)
    .order('helpful_votes', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(article => ({
    ...article,
    helpfulness_rate: article.total_votes > 0
      ? Math.round((article.helpful_votes / article.total_votes) * 100)
      : 0,
    author: Array.isArray(article.author) ? article.author[0] : article.author
  }))
}

/**
 * Get recent articles
 * Used by: Data table
 */
export async function getRecentArticles(limit: number = 10): Promise<TopArticle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(`
      id,
      title,
      category,
      view_count,
      helpful_votes,
      total_votes,
      published_at,
      author:users!author_id (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(article => ({
    ...article,
    helpfulness_rate: article.total_votes > 0
      ? Math.round((article.helpful_votes / article.total_votes) * 100)
      : 0,
    author: Array.isArray(article.author) ? article.author[0] : article.author
  }))
}
