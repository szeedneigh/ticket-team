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
import { createArticle, updateArticle } from '@/lib/kb/actions'
import { KBEditorForm } from '@/components/kb/kb-editor-form'
import { isValidUUID } from '@/lib/utils'
import { PenLine, Sparkles } from 'lucide-react'

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
    <div className="min-h-full bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-12 pb-6 px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1f3463]/20 to-[#2cafdd]/20 border border-white/10">
              <PenLine className="h-5 w-5 text-[#0693D2]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd]">
              Edit Article
            </h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            Editing: <span className="font-medium text-foreground">{article.title}</span>
            <Sparkles className="h-4 w-4 text-[#2cafdd]" />
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <KBEditorForm
          article={article}
          mode="edit"
          createArticleAction={createArticle}
          updateArticleAction={updateArticle}
        />
      </div>
    </div>
  )
}
