/**
 * Edit KB Article Page
 *
 * Server Component that renders the article editing form.
 * Only accessible to article author or admins.
 */

import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/session'
import { getArticleById, canUserEditArticle, getAllTags } from '@/lib/kb/queries'
import { KBEditorForm } from '@/components/kb/kb-editor-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { isValidUUID } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params

  try {
    const article = await getArticleById(id)
    return {
      title: `Edit: ${article.title} - Knowledge Base`,
      description: `Edit knowledge base article: ${article.title}`
    }
  } catch {
    return {
      title: 'Edit Article - Knowledge Base',
      description: 'Edit knowledge base article'
    }
  }
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID format before attempting any operations
  if (!isValidUUID(id)) {
    notFound()
  }

  const user = await requireAuth()

  // Fetch article
  let article
  try {
    article = await getArticleById(id)
  } catch {
    notFound()
  }

  // Check if user can edit this article
  const canEdit = await canUserEditArticle(id, user.id, user.role)
  if (!canEdit) {
    redirect(`/kb/${id}`)
  }

  // Fetch existing tags for autocomplete
  const existingTags = await getAllTags()

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/kb">Knowledge Base</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/kb/${id}`}>
              {article.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Editor Form */}
      <KBEditorForm
        mode="edit"
        article={article}
        existingTags={existingTags}
      />
    </div>
  )
}
