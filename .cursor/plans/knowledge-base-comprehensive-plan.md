# Knowledge Base Feature - Comprehensive Implementation Plan

> **Project**: Ticket Team - AI-Powered Helpdesk Platform
> **Feature**: Knowledge Base with RAG-Powered Semantic Search
> **Tech Stack**: Next.js 15, TypeScript, Supabase (PostgreSQL + pgvector), Gemini AI, shadcn/ui
> **Design System**: Mobile-First, Glassmorphism, LVCC Brand Colors

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [UI/UX Design](#uiux-design)
3. [Backend Architecture](#backend-architecture)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Features Overview

#### **Public KB Access** (All authenticated users)
- Browse articles with advanced filtering (category, tags, search)
- Semantic search powered by Gemini AI + pgvector
- Article detail view with voting and related articles
- Mobile-optimized responsive design

#### **Article Management** (Staff+)
- Rich text editor with Tiptap
- Draft workflow (draft → published → archived)
- Auto-save and draft recovery
- Tag management and categorization

#### **Analytics Dashboard** (Admin+)
- Comprehensive article statistics
- Interactive data visualizations (Recharts)
- Performance metrics and insights

---

## UI/UX Design

### 1. KB Browse Page (`/kb`)

**Component Hierarchy:**
```
KBBrowsePage (Server Component)
├── PageHeader (Breadcrumb + Title)
├── SearchSection (Client - debounced search)
├── FilterBar (Client - category, tags, sort)
├── ArticleGrid (Server - paginated articles)
│   └── ArticleCard[] (Client - vote interactions)
└── PaginationSection
```

**Responsive Breakpoints:**
- **Mobile (< 768px)**: 1-column grid, collapsible filters, sticky search
- **Tablet (768px - 1024px)**: 2-column grid, inline filters
- **Desktop (> 1024px)**: 3-column grid, sidebar filters

**Key Components:**
- **ArticleCard**: Glassmorphism card with category badge, tags (max 3), author avatar, stats (views, helpfulness %), relative timestamp
- **SearchInput**: Debounced input with keyboard shortcuts (Cmd/Ctrl + K)
- **FilterBar**: Category dropdown, multi-select tags, sort by (recent/popular/helpful)

**Color Scheme:**
```typescript
categories: {
  'Technical': 'bg-blue-50 text-blue-700 border-blue-200',
  'Account': 'bg-purple-50 text-purple-700 border-purple-200',
  'Enrollment': 'bg-green-50 text-green-700 border-green-200',
  'General': 'bg-gray-50 text-gray-700 border-gray-200',
}
```

**Animations:**
- Staggered card entrance (0.05s delay between cards)
- Hover lift effect (y: -4px)
- Smooth page transitions

---

### 2. Article Detail Page (`/kb/[id]`)

**Component Hierarchy:**
```
ArticleDetailPage (Server Component)
├── BreadcrumbNav (Home > KB > Category > Article)
├── ArticleHeader (Title, Author, Metadata, Tags)
├── ArticleLayout
│   ├── Sidebar (Desktop - Sticky TOC)
│   │   └── TableOfContents (Client - scroll tracking)
│   └── MainContent
│       ├── TOCCollapsible (Mobile - Accordion)
│       ├── ArticleContent (Prose styling + syntax highlighting)
│       ├── FeedbackSection (Client - thumbs up/down)
│       └── RelatedArticles (Semantic similarity)
└── FloatingActionButton (Staff only - Edit)
```

**Typography & Prose:**
```css
prose prose-slate dark:prose-invert
prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:scroll-mt-20
prose-a:text-[#0693D2] hover:prose-a:underline
prose-code:bg-muted prose-code:rounded prose-code:px-1.5
prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
```

**Table of Contents:**
- Auto-generated from h2/h3 headings
- Intersection Observer for active section highlighting
- Smooth scroll on click
- Sticky sidebar on desktop, collapsible accordion on mobile

**Feedback Section:**
- "Was this helpful?" with 👍/👎 buttons
- Optional feedback textarea if not helpful
- Optimistic UI update with Server Action
- Toast notification on success

---

### 3. KB Article Editor (`/kb/new`, `/kb/[id]/edit`)

**Component Hierarchy:**
```
KBEditorPage (Server Component)
├── PageHeader
├── DraftRecoveryDialog (Client - on mount if draft exists)
└── KBEditorForm (Client - react-hook-form + Zod)
    ├── EditorTabs (Write | Preview)
    ├── EditorMetadataForm (Sidebar on desktop, top on mobile)
    │   ├── Input (Title)
    │   ├── Textarea (Summary)
    │   ├── Select (Category → Subcategory)
    │   ├── TagInput (Chip-based autocomplete)
    │   └── Select (Status - draft/published/archived)
    ├── TiptapEditor (Write tab)
    │   ├── EditorToolbar (Bold, Italic, Code, Lists, Headings, Links, Images)
    │   └── EditorContent (ProseMirror)
    ├── MarkdownPreview (Preview tab - rendered HTML)
    └── StickyActionBar (Bottom mobile, top desktop)
        ├── AutoSaveIndicator (Saving... | Saved 2s ago | Error)
        ├── Button (Save Draft - secondary)
        ├── Button (Publish - primary, validation required)
        ├── Button (Cancel - ghost, with unsaved changes warning)
        └── Button (Delete - destructive, confirmation dialog)
```

**Rich Text Editor: Tiptap**
- Headless, React-friendly, TypeScript support
- Extensions: Bold, Italic, Code, Heading, BulletList, OrderedList, Link, Image, CodeBlock
- Markdown shortcuts (e.g., `**bold**`, `# Heading`)
- Tailwind-styled toolbar and content area

**Form Validation (Zod):**
```typescript
kbArticleSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(50000),
  summary: z.string().min(10).max(500).optional().nullable(),
  category: z.string().min(1),
  subcategory: z.string().nullable().optional(),
  tags: z.array(z.string().min(2).max(30)).max(10),
  status: z.enum(['draft', 'published', 'archived']),
})
```

**Auto-Save Strategy:**
- Debounce user input (2 seconds)
- Save to localStorage (draft recovery)
- Server Action for persistence (optimistic UI)
- Indicator states: idle → saving → saved → error

**Draft Recovery:**
- On page load, check localStorage for unsaved draft
- Show dialog: "You have unsaved changes. Restore draft or discard?"
- Restore button populates form, Discard clears localStorage
- Drafts expire after 24 hours

---

### 4. KB Analytics Dashboard (`/kb/analytics`)

**Component Hierarchy:**
```
KBAnalyticsPage (Server Component)
├── PageHeader
├── StatsCardGrid
│   ├── StatsCard (Total Articles)
│   ├── StatsCard (Published)
│   ├── StatsCard (Drafts)
│   ├── StatsCard (Total Views)
│   └── StatsCard (Avg Helpfulness %)
├── ChartsSection
│   ├── ViewsOverTimeChart (Line - Recharts)
│   ├── CategoryDistributionChart (Pie - Recharts)
│   └── TopArticlesChart (Bar - Recharts)
└── DataTablesSection
    ├── MostViewedTable
    ├── MostHelpfulTable
    └── RecentArticlesTable
```

**Chart Library: Recharts**
- React-first, composable components
- Responsive by default
- Tailwind-friendly styling
- Tree-shakeable (optimize bundle size)

**Responsive Layout:**
- **Mobile**: Stack all cards/charts vertically, horizontal scroll tables
- **Tablet**: 2-column grid for stats, stack charts
- **Desktop**: 5-column stats grid, 2-column charts, full-width tables

**Data Tables:**
- Columns: Title, Category, Views, Helpfulness %, Published Date, Author
- Sortable headers (click to sort ASC/DESC)
- Pagination (20 per page)
- Mobile: Card view instead of table
- Desktop: Full table with sticky header

---

## Backend Architecture

### Database Schema (Existing)

```sql
-- knowledge_articles table (already migrated)
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status article_status NOT NULL DEFAULT 'draft', -- enum: draft, published, archived
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_votes INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  embedding vector(1536), -- For semantic search with Gemini text-embedding-004
  source_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- article_votes table (already migrated)
CREATE TABLE article_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_vote_per_user_per_article UNIQUE (article_id, user_id)
);

-- Indexes (already created)
CREATE INDEX idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_author ON knowledge_articles(author_id);
CREATE INDEX idx_knowledge_articles_embedding ON knowledge_articles USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_article_votes_article ON article_votes(article_id);
CREATE INDEX idx_article_votes_user ON article_votes(user_id);
```

---

### Backend Implementation

#### 1. **Data Fetching (Server-Side Queries)**

**File:** `src/lib/kb/queries.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { KnowledgeArticleWithAuthor, ArticleSearchFilters } from '@/lib/types/knowledge-base'

/**
 * Get paginated KB articles with filters
 * Used by: Browse page
 */
export async function getArticles(
  filters: ArticleSearchFilters,
  page: number = 1,
  perPage: number = 20
) {
  const supabase = await createClient()
  const offset = (page - 1) * perPage

  let query = supabase
    .from('knowledge_articles')
    .select(`
      *,
      author:users!author_id (
        id, full_name, email, avatar_url
      )
    `, { count: 'exact' })

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  } else {
    query = query.eq('status', 'published') // Default: only published
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }

  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id)
  }

  // Pagination and sorting
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    articles: data as KnowledgeArticleWithAuthor[],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage)
  }
}

/**
 * Get single article by ID with author info
 * Used by: Article detail page
 */
export async function getArticleById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(`
      *,
      author:users!author_id (
        id, full_name, email, avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Article not found')

  // Increment view count (non-blocking)
  supabase
    .from('knowledge_articles')
    .update({ view_count: data.view_count + 1 })
    .eq('id', id)
    .then() // Fire and forget

  return data as KnowledgeArticleWithAuthor
}

/**
 * Get user's vote on an article
 * Used by: Article detail page
 */
export async function getUserVote(articleId: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('article_votes')
    .select('*')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Get related articles using semantic similarity
 * Used by: Article detail page
 */
export async function getRelatedArticles(articleId: string, limit: number = 5) {
  const supabase = await createClient()

  // First, get the current article's embedding
  const { data: article, error: articleError } = await supabase
    .from('knowledge_articles')
    .select('embedding')
    .eq('id', articleId)
    .single()

  if (articleError || !article?.embedding) {
    // Fallback: return articles from same category
    const { data: currentArticle } = await supabase
      .from('knowledge_articles')
      .select('category')
      .eq('id', articleId)
      .single()

    const { data } = await supabase
      .from('knowledge_articles')
      .select('id, title, summary, category, view_count')
      .eq('status', 'published')
      .eq('category', currentArticle?.category || '')
      .neq('id', articleId)
      .order('view_count', { ascending: false })
      .limit(limit)

    return data || []
  }

  // Use pgvector similarity search
  const { data, error } = await supabase.rpc('match_kb_articles', {
    query_embedding: article.embedding,
    match_threshold: 0.7,
    match_count: limit + 1, // +1 because current article will be in results
  })

  if (error) throw error

  // Filter out current article
  return data?.filter((a: any) => a.id !== articleId).slice(0, limit) || []
}

/**
 * Get all unique categories
 * Used by: Filter dropdown
 */
export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('category, subcategory')
    .eq('status', 'published')

  if (error) throw error

  // Group by category and subcategories
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
    subcategories: Array.from(subcategories)
  }))
}

/**
 * Get all unique tags
 * Used by: Tag filter, autocomplete
 */
export async function getAllTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('tags')
    .eq('status', 'published')

  if (error) throw error

  // Flatten and deduplicate tags
  const allTags = new Set<string>()
  data?.forEach(({ tags }) => {
    tags.forEach((tag: string) => allTags.add(tag))
  })

  return Array.from(allTags).sort()
}
```

---

#### 2. **Mutations (Server Actions)**

**File:** `src/lib/kb/actions.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { kbArticleSchema } from '@/lib/validations/kb-articles'
import { requireAuth } from '@/lib/auth/session'
import { isStaffOrAbove } from '@/lib/types/database'
import type { KBArticleInput } from '@/lib/validations/kb-articles'

/**
 * Create new KB article
 * Access: Staff+
 */
export async function createArticle(data: KBArticleInput) {
  try {
    // 1. Authenticate and authorize
    const user = await requireAuth()
    if (!isStaffOrAbove(user.role)) {
      return { error: 'Unauthorized. Staff access required.' }
    }

    // 2. Validate input
    const validated = kbArticleSchema.parse(data)

    // 3. Generate embedding for semantic search
    const embedding = await generateEmbedding(
      `${validated.title}\n\n${validated.content}`
    )

    // 4. Insert article
    const supabase = await createClient()
    const { data: article, error } = await supabase
      .from('knowledge_articles')
      .insert({
        ...validated,
        author_id: user.id,
        embedding,
        published_at: validated.status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error

    // 5. Revalidate and redirect
    revalidatePath('/kb')
    redirect(`/kb/${article.id}`)
  } catch (error) {
    console.error('Create article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to create article'
    }
  }
}

/**
 * Update existing KB article
 * Access: Staff (own articles) | Admin (all articles)
 */
export async function updateArticle(id: string, data: Partial<KBArticleInput>) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // 1. Check ownership/authorization
    const { data: article, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const isAuthor = article.author_id === user.id
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'

    if (!isAuthor && !isAdmin) {
      return { error: 'Unauthorized. You can only edit your own articles.' }
    }

    // 2. Validate partial input
    const validated = kbArticleSchema.partial().parse(data)

    // 3. Regenerate embedding if content changed
    let embedding
    if (validated.title || validated.content) {
      const titleToEmbed = validated.title || article.title
      const contentToEmbed = validated.content || article.content
      embedding = await generateEmbedding(`${titleToEmbed}\n\n${contentToEmbed}`)
    }

    // 4. Update article
    const updateData: any = {
      ...validated,
      updated_at: new Date().toISOString()
    }

    if (embedding) {
      updateData.embedding = embedding
    }

    // Set published_at if status changed to published
    if (validated.status === 'published' && article.status !== 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('knowledge_articles')
      .update(updateData)
      .eq('id', id)

    if (updateError) throw updateError

    // 5. Revalidate
    revalidatePath('/kb')
    revalidatePath(`/kb/${id}`)

    return { success: true }
  } catch (error) {
    console.error('Update article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to update article'
    }
  }
}

/**
 * Delete KB article
 * Access: Staff (own articles) | Admin (all articles)
 */
export async function deleteArticle(id: string) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // 1. Check ownership/authorization
    const { data: article, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('author_id, title')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const isAuthor = article.author_id === user.id
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'

    if (!isAuthor && !isAdmin) {
      return { error: 'Unauthorized. You can only delete your own articles.' }
    }

    // 2. Delete article (cascade will delete votes)
    const { error: deleteError } = await supabase
      .from('knowledge_articles')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // 3. Revalidate and redirect
    revalidatePath('/kb')
    redirect('/kb')
  } catch (error) {
    console.error('Delete article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to delete article'
    }
  }
}

/**
 * Vote on KB article (helpful or not helpful)
 * Access: All authenticated users
 */
export async function voteArticle(articleId: string, isHelpful: boolean, feedbackText?: string) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // 1. Upsert vote (update if exists, insert if not)
    const { error: voteError } = await supabase
      .from('article_votes')
      .upsert({
        article_id: articleId,
        user_id: user.id,
        is_helpful: isHelpful,
        feedback_text: feedbackText || null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'article_id,user_id'
      })

    if (voteError) throw voteError

    // 2. Recalculate article vote counts
    const { data: votes, error: countError } = await supabase
      .from('article_votes')
      .select('is_helpful')
      .eq('article_id', articleId)

    if (countError) throw countError

    const helpfulVotes = votes?.filter(v => v.is_helpful).length || 0
    const totalVotes = votes?.length || 0

    // 3. Update article vote counts
    const { error: updateError } = await supabase
      .from('knowledge_articles')
      .update({
        helpful_votes: helpfulVotes,
        total_votes: totalVotes
      })
      .eq('id', articleId)

    if (updateError) throw updateError

    // 4. Revalidate
    revalidatePath(`/kb/${articleId}`)

    return { success: true }
  } catch (error) {
    console.error('Vote article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to submit vote'
    }
  }
}

/**
 * Generate embedding for article content
 * Uses Gemini text-embedding-004 (1536 dimensions)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { GoogleGenAI } = await import('@google/genai')
  const { serverEnv } = await import('@/lib/env/server')

  const ai = new GoogleGenAI({ apiKey: serverEnv.gemini.apiKey })

  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text
  })

  return result.embeddings[0].values
}
```

---

#### 3. **Analytics Queries**

**File:** `src/lib/kb/analytics-queries.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { ArticleStats } from '@/lib/types/knowledge-base'

/**
 * Get KB overview statistics
 * Used by: Analytics dashboard
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
 * Get views over time (daily aggregation)
 * Used by: Line chart
 */
export async function getViewsOverTime(days: number = 30) {
  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Note: This requires a view_logs table or similar tracking
  // For MVP, we can aggregate by created_at as a proxy
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('created_at, view_count')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'published')

  if (error) throw error

  // TODO: Implement proper view tracking with timestamps
  // For now, return article creation dates as proxy
  return data || []
}

/**
 * Get category distribution
 * Used by: Pie chart
 */
export async function getCategoryDistribution() {
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
export async function getTopArticles(limit: number = 10) {
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

  return data || []
}

/**
 * Get most helpful articles
 * Used by: Data table
 */
export async function getMostHelpfulArticles(limit: number = 10) {
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

  return data || []
}

/**
 * Get recent articles
 * Used by: Data table
 */
export async function getRecentArticles(limit: number = 10) {
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

  return data || []
}
```

---

#### 4. **API Routes (for AI-powered features)**

**File:** `src/app/api/kb/semantic-search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env/server'
import { requireAuth } from '@/lib/auth/session'

/**
 * POST /api/kb/semantic-search
 *
 * Semantic search using Gemini embeddings + pgvector
 * Body: { query: string, threshold?: number, limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    await requireAuth()

    // 2. Parse request
    const { query, threshold = 0.7, limit = 10 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 3. Generate embedding for query
    const ai = new GoogleGenAI({ apiKey: serverEnv.gemini.apiKey })
    const embeddingResult = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: query
    })

    const queryEmbedding = embeddingResult.embeddings[0].values

    // 4. Semantic search via pgvector
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('match_kb_articles', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) throw error

    // 5. Return results
    return NextResponse.json({
      query,
      results: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Semantic search failed' },
      { status: 500 }
    )
  }
}
```

**Database Function (already in migrations):**

```sql
-- supabase/migrations/20250114000005_create_functions_triggers.sql
CREATE OR REPLACE FUNCTION match_kb_articles(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
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
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_articles.id,
    knowledge_articles.title,
    knowledge_articles.content,
    knowledge_articles.summary,
    knowledge_articles.category,
    knowledge_articles.subcategory,
    knowledge_articles.tags,
    knowledge_articles.view_count,
    knowledge_articles.helpful_votes,
    knowledge_articles.total_votes,
    1 - (knowledge_articles.embedding <=> query_embedding) AS similarity
  FROM knowledge_articles
  WHERE
    knowledge_articles.status = 'published'
    AND LENGTH(knowledge_articles.content) >= min_content_length
    AND 1 - (knowledge_articles.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

---

#### 5. **Validation Schemas**

**File:** `src/lib/validations/kb-articles.ts`

```typescript
import { z } from 'zod'

export const kbArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),

  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(50000, 'Content must not exceed 50,000 characters'),

  summary: z
    .string()
    .min(10, 'Summary must be at least 10 characters')
    .max(500, 'Summary must not exceed 500 characters')
    .optional()
    .nullable(),

  category: z
    .string()
    .min(1, 'Category is required'),

  subcategory: z
    .string()
    .nullable()
    .optional(),

  tags: z
    .array(z.string().min(2).max(30))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),

  status: z.enum(['draft', 'published', 'archived']),
})

export type KBArticleInput = z.infer<typeof kbArticleSchema>

// Partial schema for updates
export const kbArticleUpdateSchema = kbArticleSchema.partial()

// Draft schema (allows partial data for auto-save)
export const kbArticleDraftSchema = kbArticleSchema.partial()
export type KBArticleDraft = z.infer<typeof kbArticleDraftSchema>

// Vote schema
export const articleVoteSchema = z.object({
  article_id: z.string().uuid(),
  is_helpful: z.boolean(),
  feedback_text: z.string().max(500).optional()
})

export type ArticleVoteInput = z.infer<typeof articleVoteSchema>
```

---

#### 6. **Row Level Security (RLS) Policies**

**File:** `supabase/migrations/20250114000004_create_rls_policies.sql` (already exists, add KB policies)

```sql
-- ============================================================================
-- KNOWLEDGE ARTICLES RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published articles
CREATE POLICY "Anyone can view published articles"
  ON knowledge_articles
  FOR SELECT
  USING (status = 'published');

-- Policy: Staff can view their own drafts
CREATE POLICY "Staff can view own drafts"
  ON knowledge_articles
  FOR SELECT
  USING (
    status IN ('draft', 'archived')
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin', 'super_admin')
    )
  );

-- Policy: Admins can view all articles
CREATE POLICY "Admins can view all articles"
  ON knowledge_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Staff can insert articles
CREATE POLICY "Staff can insert articles"
  ON knowledge_articles
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin', 'super_admin')
    )
  );

-- Policy: Authors can update own articles
CREATE POLICY "Authors can update own articles"
  ON knowledge_articles
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Policy: Admins can update any article
CREATE POLICY "Admins can update any article"
  ON knowledge_articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Authors can delete own articles
CREATE POLICY "Authors can delete own articles"
  ON knowledge_articles
  FOR DELETE
  USING (author_id = auth.uid());

-- Policy: Admins can delete any article
CREATE POLICY "Admins can delete any article"
  ON knowledge_articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- ARTICLE VOTES RLS POLICIES
-- ============================================================================

-- Policy: Anyone can view article votes
CREATE POLICY "Anyone can view article votes"
  ON article_votes
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own votes
CREATE POLICY "Users can insert own votes"
  ON article_votes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON article_votes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON article_votes
  FOR DELETE
  USING (user_id = auth.uid());
```

---

## Implementation Phases

### **Phase 1: Foundation (Week 1)**

**Goal:** Establish core data layer and basic UI

**Tasks:**
1. ✅ Database schema (already migrated)
2. ✅ TypeScript types (already exists in `src/lib/types/knowledge-base.ts`)
3. ✅ Zod validation schemas (`src/lib/validations/kb-articles.ts`)
4. ✅ RLS policies (add to existing migration)
5. Create base queries (`src/lib/kb/queries.ts`)
6. Create base page structure:
   - `/kb/page.tsx` (empty state)
   - `/kb/[id]/page.tsx` (skeleton)

**Deliverables:**
- All files compile with no TypeScript errors
- Database queries return mock data
- Pages render with empty/loading states

---

### **Phase 2: Browse & Detail Pages (Week 2)**

**Goal:** Users can browse and view published articles

**Tasks:**
1. **Browse Page (`/kb`):**
   - Implement `getArticles()` query
   - Create `ArticleCard` component
   - Implement search with debounce
   - Add filter bar (category, tags, sort)
   - Add pagination component
   - Implement loading skeletons

2. **Detail Page (`/kb/[id]`):**
   - Implement `getArticleById()` query
   - Create article layout with TOC
   - Add prose styling for content
   - Implement vote functionality (Server Action)
   - Add related articles section
   - Create breadcrumb navigation

3. **Shared Components:**
   - `CategoryBadge` component
   - `TagBadge` component
   - `ArticleMetadata` component (author, date, views)

**Testing:**
1. Create 10+ sample articles with different categories
2. Test search functionality
3. Test filtering and sorting
4. Test responsive layouts (mobile/tablet/desktop)
5. Test voting (optimistic updates)

**Deliverables:**
- Fully functional browse page with search/filters
- Detailed article view with voting
- Mobile-optimized layouts

---

### **Phase 3: Article Editor (Week 3)**

**Goal:** Staff can create and edit articles

**Tasks:**
1. **Editor Setup:**
   - Install Tiptap dependencies: `@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image`
   - Create `TiptapEditor` component with toolbar
   - Implement Write/Preview tabs

2. **Editor Form:**
   - Create `KBEditorForm` with react-hook-form
   - Implement metadata fields (title, summary, category, tags)
   - Add tag autocomplete with chip input
   - Implement status selection (draft/published)

3. **Server Actions:**
   - Implement `createArticle()` action
   - Implement `updateArticle()` action
   - Implement `deleteArticle()` action
   - Add embedding generation integration

4. **Auto-Save & Draft Recovery:**
   - Create `useAutoSave` hook
   - Implement localStorage draft storage
   - Create `DraftRecoveryDialog` component
   - Add auto-save indicator

5. **Pages:**
   - `/kb/new/page.tsx` - New article form
   - `/kb/[id]/edit/page.tsx` - Edit existing article

**Testing:**
1. Create new article (draft → publish)
2. Edit existing article
3. Test auto-save functionality
4. Test draft recovery after browser refresh
5. Test embedding generation
6. Test permissions (staff can only edit own, admin can edit all)

**Deliverables:**
- Fully functional rich text editor
- Auto-save with draft recovery
- Create/edit/delete workflows
- AI embedding generation working

---

### **Phase 4: Analytics Dashboard (Week 4)**

**Goal:** Admins can view KB performance metrics

**Tasks:**
1. **Data Layer:**
   - Implement analytics queries (`analytics-queries.ts`)
   - Create stats calculation functions

2. **Stats Cards:**
   - Reuse `StatsCard` component from dashboard
   - Create stats grid layout

3. **Charts:**
   - Install Recharts: `recharts`
   - Create `ViewsOverTimeChart` component (line chart)
   - Create `CategoryDistributionChart` component (pie chart)
   - Create `TopArticlesChart` component (bar chart)
   - Implement responsive chart containers

4. **Data Tables:**
   - Create `ArticleDataTable` component
   - Implement sortable columns
   - Add pagination for large datasets
   - Create mobile card view

5. **Page:**
   - `/kb/analytics/page.tsx` - Full analytics dashboard

**Testing:**
1. Verify all stats calculations are correct
2. Test charts with various data sizes
3. Test responsive layouts
4. Test data table sorting and pagination
5. Verify admin-only access

**Deliverables:**
- Comprehensive analytics dashboard
- Interactive charts with Recharts
- Data tables with sorting/pagination
- Mobile-responsive design

---

### **Phase 5: Semantic Search (Week 5)**

**Goal:** AI-powered semantic search for better discoverability

**Tasks:**
1. **API Route:**
   - Create `/api/kb/semantic-search/route.ts`
   - Implement Gemini embedding generation
   - Integrate with pgvector `match_kb_articles()` function

2. **Search UI:**
   - Add "Semantic Search" toggle to browse page
   - Create search results page with relevance scores
   - Highlight matching snippets
   - Show similarity percentage

3. **Embedding Pipeline:**
   - Generate embeddings on article create/update
   - Batch update embeddings for existing articles (migration script)

4. **Testing:**
   - Test semantic search with various queries
   - Compare with keyword search results
   - Verify relevance scores
   - Test performance with large article count

**Deliverables:**
- Functional semantic search API
- Toggle between keyword and semantic search
- Embeddings generated for all articles
- Search results with relevance indicators

---

### **Phase 6: Polish & Optimization (Week 6)**

**Goal:** Production-ready with excellent UX

**Tasks:**
1. **Performance:**
   - Implement code splitting for editor
   - Add image optimization (Next/Image)
   - Implement virtual scrolling for long lists
   - Add React.memo to expensive components
   - Optimize database queries (review indexes)

2. **Accessibility:**
   - Add ARIA labels to all interactive elements
   - Test keyboard navigation
   - Verify color contrast ratios
   - Add focus-visible styles
   - Test with screen reader

3. **Error Handling:**
   - Add error boundaries
   - Implement toast notifications (use `sonner`)
   - Add retry logic for failed mutations
   - Create friendly error messages

4. **Documentation:**
   - Write user guide for KB feature
   - Document staff article creation workflow
   - Create admin analytics guide
   - Add inline help tooltips

5. **Testing:**
   - E2E tests for critical workflows (Playwright/Cypress)
   - Unit tests for utility functions
   - Integration tests for Server Actions
   - Manual QA across devices and browsers

**Deliverables:**
- Optimized bundle size
- WCAG AA compliant
- Comprehensive error handling
- User documentation
- Test coverage

---

## File Structure

```
ticket-team/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── kb/
│   │   │       ├── page.tsx                     # Browse page
│   │   │       ├── loading.tsx                  # Loading state
│   │   │       ├── new/
│   │   │       │   └── page.tsx                 # New article form
│   │   │       ├── [id]/
│   │   │       │   ├── page.tsx                 # Article detail
│   │   │       │   └── edit/
│   │   │       │       └── page.tsx             # Edit article form
│   │   │       ├── search/
│   │   │       │   └── page.tsx                 # Search results
│   │   │       └── analytics/
│   │   │           └── page.tsx                 # Analytics dashboard
│   │   └── api/
│   │       └── kb/
│   │           └── semantic-search/
│   │               └── route.ts                 # Semantic search API
│   │
│   ├── components/
│   │   └── kb/
│   │       ├── article-card.tsx                 # Article preview card
│   │       ├── article-grid.tsx                 # Grid layout wrapper
│   │       ├── search-section.tsx               # Search input with toggle
│   │       ├── filter-bar.tsx                   # Category/tag filters
│   │       ├── category-badge.tsx               # Color-coded category
│   │       ├── tag-badge.tsx                    # Tag chip
│   │       ├── table-of-contents.tsx            # TOC sidebar
│   │       ├── feedback-section.tsx             # Vote buttons
│   │       ├── related-articles.tsx             # Related articles list
│   │       ├── kb-editor-form.tsx               # Editor form wrapper
│   │       ├── tiptap-editor.tsx                # Rich text editor
│   │       ├── tag-input.tsx                    # Chip-based tag input
│   │       ├── draft-recovery-dialog.tsx        # Draft recovery modal
│   │       ├── auto-save-indicator.tsx          # Save status
│   │       └── analytics/
│   │           ├── views-over-time-chart.tsx    # Line chart
│   │           ├── category-distribution-chart.tsx # Pie chart
│   │           ├── top-articles-chart.tsx       # Bar chart
│   │           └── article-data-table.tsx       # Reusable table
│   │
│   ├── lib/
│   │   ├── kb/
│   │   │   ├── queries.ts                       # Server-side queries
│   │   │   ├── actions.ts                       # Server Actions
│   │   │   ├── analytics-queries.ts             # Analytics data
│   │   │   └── draft-storage.ts                 # LocalStorage utils
│   │   ├── types/
│   │   │   └── knowledge-base.ts                # KB types (✅ exists)
│   │   ├── validations/
│   │   │   └── kb-articles.ts                   # Zod schemas
│   │   └── hooks/
│   │       ├── use-auto-save.ts                 # Auto-save hook
│   │       └── use-debounce.ts                  # Debounce hook (✅ exists)
│   │
│   └── supabase/
│       └── migrations/
│           └── 202501XX_kb_rls_policies.sql     # Add KB RLS policies
│
├── package.json                                 # Add: @tiptap/react, recharts
└── .cursor/
    └── plans/
        └── knowledge-base-comprehensive-plan.md # This document
```

---

## Testing Strategy

### Unit Tests
- Utility functions (formatters, validators)
- Zod schema validation
- React hooks (useAutoSave, useDebounce)
- Type guards and helpers

### Integration Tests
- Server Actions (create, update, delete, vote)
- Database queries (getArticles, getArticleById)
- API routes (semantic search)
- Supabase RLS policies

### E2E Tests (Critical Flows)
1. **Browse & Search:**
   - User navigates to /kb
   - User searches for "password reset"
   - User filters by category "Technical"
   - User clicks article card → navigates to detail

2. **Article Voting:**
   - User views article
   - User clicks "Helpful" button
   - Vote count updates optimistically
   - Toast notification appears

3. **Article Creation (Staff):**
   - Staff user navigates to /kb/new
   - Staff fills out form (title, content, category)
   - Staff clicks "Save Draft" → draft saved
   - Staff refreshes page → draft recovered
   - Staff clicks "Publish" → article published
   - User can view published article at /kb/[id]

4. **Article Editing (Staff):**
   - Staff navigates to own article
   - Staff clicks "Edit" button
   - Staff updates content
   - Auto-save indicator shows "Saved"
   - Staff clicks "Publish" → changes visible

5. **Analytics (Admin):**
   - Admin navigates to /kb/analytics
   - All stats load correctly
   - Charts render with data
   - Tables are sortable and paginated

### Manual QA Checklist
- [ ] Mobile responsiveness (iPhone SE, iPhone 14, Android)
- [ ] Tablet responsiveness (iPad, Android tablet)
- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Dark mode support
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Performance (Lighthouse score > 90)
- [ ] Bundle size (< 500KB for KB feature)
- [ ] Semantic search accuracy
- [ ] Image uploads in editor
- [ ] Link creation in editor
- [ ] Code blocks in articles
- [ ] Long article rendering (10,000+ words)
- [ ] Many tags (10 tags per article)
- [ ] Large article count (1000+ articles)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings resolved
- [ ] Database migrations applied to production Supabase
- [ ] RLS policies tested thoroughly
- [ ] Environment variables configured in Vercel
- [ ] Gemini API key configured (server-side only)
- [ ] Build succeeds locally: `npm run build`
- [ ] Bundle security scan passes: `npm run check-bundle-security`
- [ ] All E2E tests pass

### Post-Deployment
- [ ] Verify /kb page loads in production
- [ ] Test article creation in production
- [ ] Test semantic search in production
- [ ] Monitor Sentry for errors (first 24h)
- [ ] Check Supabase logs for RLS issues
- [ ] Verify analytics dashboard in production
- [ ] Test on real devices (mobile, tablet)
- [ ] Collect user feedback

### Monitoring
- Set up alerts for:
  - High error rate on /kb routes
  - Slow API response times (> 2s)
  - Failed embedding generations
  - Unusual vote patterns (abuse detection)

---

## Success Metrics

### User Engagement
- **Article Views**: Track daily/weekly views per article
- **Search Usage**: % of users using semantic vs keyword search
- **Vote Participation**: % of article viewers who vote
- **Average Helpfulness**: Target > 70% across all articles

### Content Quality
- **Articles Published**: Target 50+ articles in first month
- **Categories Covered**: All major support topics
- **Average Article Length**: Target 300-800 words (optimal)
- **Tag Coverage**: Target 20+ unique tags

### Performance
- **Page Load Time**: < 1.5s (LCP)
- **Search Response Time**: < 800ms
- **Time to Vote**: < 200ms (optimistic update)
- **Editor Auto-Save Latency**: < 500ms

### Support Impact
- **Ticket Deflection**: % reduction in repeat tickets
- **Self-Service Resolution**: % of users who find answers in KB
- **Staff Time Saved**: Hours saved per week

---

## Future Enhancements (Post-MVP)

1. **Rich Attachments:**
   - Inline images in articles
   - Video embeds (YouTube, Loom)
   - PDF attachments
   - File downloads

2. **Collaboration:**
   - Article comments/discussions
   - Article suggestions from users
   - Co-authoring with multiple staff
   - Approval workflow (draft → review → published)

3. **Advanced Search:**
   - Filters: date range, author, view count
   - Saved searches
   - Search history
   - Related searches suggestions

4. **Personalization:**
   - Recommended articles based on user tickets
   - Bookmarked articles
   - Reading history
   - "Articles you might like"

5. **SEO & Public Access:**
   - Public KB (unauthenticated access)
   - SEO optimization (meta tags, sitemaps)
   - Social sharing (Open Graph, Twitter Cards)
   - Canonical URLs

6. **Multilingual Support:**
   - Translate articles to Filipino/Tagalog
   - Language selector
   - Machine translation integration

7. **Gamification:**
   - Author badges (Top Contributor, Helpful Author)
   - Leaderboards (most helpful articles)
   - Points system for contributions

---

## Conclusion

This comprehensive plan provides a clear roadmap for implementing a world-class Knowledge Base feature for Ticket Team. The design prioritizes:

- **Mobile-First UX**: Beautiful, responsive design across all devices
- **Developer Experience**: Type-safe, well-structured, maintainable code
- **User Engagement**: Intuitive search, voting, and browsing experience
- **Staff Productivity**: Powerful editor with auto-save and draft recovery
- **Admin Insights**: Data-driven analytics for content strategy
- **AI-Powered Search**: Semantic search for better discoverability

**Estimated Timeline**: 6 weeks for MVP + polish
**Team Size**: 1-2 developers
**Complexity**: Medium-High (due to Tiptap, Recharts, and RAG integration)

Follow the phases sequentially for a smooth implementation. Test thoroughly at each phase before proceeding. Good luck! 🚀