import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sanitizeHTML } from '@/lib/utils/sanitize'
import { KBArticleClient } from '@/components/kb/kb-article-client'
import { getArticleById, getUserVote, canUserEditArticle, getRelatedArticles } from '@/lib/kb/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function KBArticlePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch article
  let article
  try {
    article = await getArticleById(id)
  } catch (error) {
    console.error('Error fetching article:', error)
    notFound()
  }

  // Format date
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Draft'

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  let userVote = null
  let canEdit = false
  
  if (user) {
    // Parallelize these fetches if possible, but sequential is fine for now
    userVote = await getUserVote(article.id, user.id)
    
    // Check permissions using the helper which checks roles
    const userRole = user.user_metadata.role || 'user'
    canEdit = await canUserEditArticle(article.id, user.id, userRole)
  }

  // Sanitize content
  const sanitizedContent = sanitizeHTML(article.content)

  // Get related articles
  // Using the helper which implements semantic search
  const relatedArticles = await getRelatedArticles(article.id)

  return (
    <KBArticleClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      article={article as any}
      relatedArticles={relatedArticles}
      userVote={userVote}
      canEdit={canEdit}
      sanitizedContent={sanitizedContent}
      publishedDate={publishedDate}
    />
  )
}
