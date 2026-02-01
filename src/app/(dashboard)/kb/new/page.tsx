/**
 * New KB Article Page
 *
 * Server Component that renders the article creation form.
 * Only accessible to staff and above.
 */

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/session'
import { isStaffOrAbove } from '@/lib/types/database'
import { getAllTags } from '@/lib/kb/queries'
import { createArticle, updateArticle } from '@/lib/kb/actions'
import { KBEditorForm } from '@/components/kb/kb-editor-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { FilePlus, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'New Article - Knowledge Base',
  description: 'Create a new knowledge base article'
}

export default async function NewArticlePage() {
  const user = await requireAuth()

  // Check if user can create articles
  if (!isStaffOrAbove(user.role)) {
    redirect('/kb')
  }

  // Fetch existing tags for autocomplete
  const existingTags = await getAllTags()

  return (
    <div className="min-h-full bg-background relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-12 pb-6 px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
          <Breadcrumb className="mb-4">
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
                <BreadcrumbPage>New Article</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1f3463]/20 to-[#2cafdd]/20 border border-white/10">
              <FilePlus className="h-5 w-5 text-[#0693D2]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd]">
              Create New Article
            </h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            Share your knowledge with the community
            <Sparkles className="h-4 w-4 text-[#2cafdd]" />
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <KBEditorForm
          mode="create"
          existingTags={existingTags ?? []}
          createArticleAction={createArticle}
          updateArticleAction={updateArticle}
        />
      </div>
    </div>
  )
}
