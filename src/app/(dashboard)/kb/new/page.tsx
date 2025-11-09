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
import { KBEditorForm } from '@/components/kb/kb-editor-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

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
            <BreadcrumbPage>New Article</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Editor Form */}
      <KBEditorForm mode="create" existingTags={existingTags} />
    </div>
  )
}
