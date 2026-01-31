/**
 * Knowledge Base Server Actions
 *
 * Server-side mutations for KB articles and votes.
 * All actions include authentication, authorization, and validation.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { kbArticleSchema, articleVoteSchema } from '@/lib/validations/kb-articles'
import { requireAuth } from '@/lib/auth/session'
import { isStaffOrAbove } from '@/lib/types/database'
import type { KBArticleInput } from '@/lib/validations/kb-articles'
import { generateDocumentEmbedding, isAIConfigured } from '@/lib/ai/client'

// ============================================================================
// Article CRUD Actions
// ============================================================================

/**
 * Generate embedding for article content, or null if AI is not configured or fails.
 * Articles without embeddings still save; semantic search won't find them until
 * embeddings are regenerated (e.g., after GEMINI_API_KEY is set).
 */
async function getEmbeddingOrNull(text: string): Promise<number[] | null> {
  if (!isAIConfigured()) {
    return null
  }
  try {
    return await generateDocumentEmbedding(text)
  } catch (err) {
    console.warn('Embedding generation failed, saving article without embedding:', err)
    return null
  }
}

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

    // 3. Generate embedding for semantic search (optional; null if AI unavailable)
    const embedding = await getEmbeddingOrNull(
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

    // 5. Revalidate cache
    revalidatePath('/kb')
    revalidatePath(`/kb/${article.id}`)

    // 6. Return success with article ID (let client handle redirect)
    return {
      success: true,
      data: {
        id: article.id,
        title: article.title,
        status: article.status
      }
    }
  } catch (error) {
    console.error('Create article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to create article'
    }
  }
}

/**
 * Update existing KB article
 * Access: Staff (own articles) | Admin+ (all articles)
 */
export async function updateArticle(id: string, data: Partial<KBArticleInput>) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // 1. Check ownership/authorization
    const { data: article, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('author_id, title, content, status')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!article) throw new Error('Article not found')

    const isAuthor = article.author_id === user.id
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'

    if (!isAuthor && !isAdmin) {
      return { error: 'Unauthorized. You can only edit your own articles.' }
    }

    // 2. Validate partial input
    const validated = kbArticleSchema.partial().parse(data)

    // 3. Regenerate embedding if content changed (optional; null if AI unavailable)
    let embedding: number[] | null | undefined
    if (validated.title || validated.content) {
      const titleToEmbed = validated.title || article.title
      const contentToEmbed = validated.content || article.content
      embedding = await getEmbeddingOrNull(`${titleToEmbed}\n\n${contentToEmbed}`)
    }

    // 4. Update article
    const updateData: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString()
    }

    if (embedding !== undefined) {
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
 * Access: Staff (own articles) | Admin+ (all articles)
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
    if (!article) throw new Error('Article not found')

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

    // 3. Revalidate cache
    revalidatePath('/kb')

    // 4. Return success (let client handle redirect)
    return { success: true }
  } catch (error) {
    console.error('Delete article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to delete article'
    }
  }
}

// ============================================================================
// Voting Actions
// ============================================================================

/**
 * Vote on KB article (helpful or not helpful)
 * Access: All authenticated users
 */
export async function voteArticle(articleId: string, isHelpful: boolean, feedbackText?: string) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // 1. Validate input
    articleVoteSchema.parse({
      article_id: articleId,
      is_helpful: isHelpful,
      feedback_text: feedbackText
    })

    // 2. Upsert vote (update if exists, insert if not)
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

    // 3. Recalculate article vote counts
    const { data: votes, error: countError } = await supabase
      .from('article_votes')
      .select('is_helpful')
      .eq('article_id', articleId)

    if (countError) throw countError

    const helpfulVotes = votes?.filter(v => v.is_helpful).length || 0
    const totalVotes = votes?.length || 0

    // 4. Update article vote counts
    const { error: updateError } = await supabase
      .from('knowledge_articles')
      .update({
        helpful_votes: helpfulVotes,
        total_votes: totalVotes
      })
      .eq('id', articleId)

    if (updateError) throw updateError

    // 5. Revalidate
    revalidatePath(`/kb/${articleId}`)

    return { success: true }
  } catch (error) {
    console.error('Vote article error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to submit vote'
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================
// Note: Embedding generation is now handled by the centralized AI client
// See @/lib/ai/client.ts for implementation details
