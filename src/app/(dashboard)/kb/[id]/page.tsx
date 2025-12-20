import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sanitizeHTML } from '@/lib/utils/sanitize'
import { isValidUUID } from '@/lib/utils'
import { KBArticleClient } from '@/components/kb/kb-article-client'
import { getArticleById, getUserVote, canUserEditArticle, getRelatedArticles } from '@/lib/kb/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Add unique IDs to h2 and h3 headings for table of contents navigation
 */
function addHeadingIds(html: string): string {
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, content) => {
    // Skip if already has an id attribute
    if (attrs.includes('id=')) {
      return match
    }
    
    // Generate ID from heading text
    const textContent = content.replace(/<[^>]+>/g, '') // Strip HTML tags
    const id = textContent
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
    
    return `<${tag}${attrs} id="${id}">${content}</${tag}>`
  })
}

export default async function KBArticlePage({ params }: PageProps) {
  const { id } = await params
  
  // Validate UUID format before database query
  if (!isValidUUID(id)) {
    notFound()
  }

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
    // Fetch user role from database (not auth metadata)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = userData?.role || 'employee'

    // Parallelize these fetches if possible, but sequential is fine for now
    userVote = await getUserVote(article.id, user.id)
    
    // Check permissions using the helper which checks roles
    canEdit = await canUserEditArticle(article.id, user.id, userRole)
  }

  // Sanitize content and add heading IDs for table of contents navigation
  let sanitizedContent = sanitizeHTML(article.content)
  sanitizedContent = addHeadingIds(sanitizedContent)

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
