/**
 * Knowledge Base Article Edit Page
 *
 * Server Component that allows authorized users to edit KB articles.
 * Only staff (authors), admins, and super_admins can edit articles.
 */

import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/session'
import { getArticleById, canUserEditArticle } from '@/lib/kb/queries'
import { KBEditorForm } from '@/components/kb/kb-editor-form'
import { PageHeader } from '@/components/shared/page-header'
import { isValidUUID } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Edit Article',
  description: 'Edit knowledge base article',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID format
  if (!isValidUUID(id)) {
    notFound()
  }

  // Get authenticated user
  const user = await requireAuth()

  // Fetch article
  let article
  try {
    article = await getArticleById(id)
  } catch {
    notFound()
  }

  if (!article) {
    notFound()
  }

  // Check authorization - only author, staff, admin, or super_admin can edit
  const canEdit = await canUserEditArticle(id, user.id, user.role)

  if (!canEdit) {
    redirect('/kb')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Edit Article"
        description={`Editing: ${article.title}`}
      />

      <KBEditorForm article={article} mode="edit" />
    </div>
  )
}
