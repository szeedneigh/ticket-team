/**
 * New KB Article from Ticket Page
 *
 * Creates a KB article draft from a resolved ticket using AI synthesis.
 * Only staff and above. Ticket must be resolved or closed.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/session'
import { isStaffOrAbove } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/server'
import { getAllTags } from '@/lib/kb/queries'
import { createArticle, updateArticle } from '@/lib/kb/actions'
import { synthesizeKBDraftFromTicket } from '@/lib/ai/automation'
import { KBEditorForm } from '@/components/kb/kb-editor-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { FilePlus, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ ticketId: string }>
}

export const metadata = {
  title: 'Create Article from Ticket - Knowledge Base',
  description: 'Create a knowledge base article from a resolved ticket'
}

export default async function NewArticleFromTicketPage({ params }: PageProps) {
  const { ticketId } = await params
  const user = await requireAuth()

  if (!isStaffOrAbove(user.role)) {
    redirect('/kb')
  }

  // Fetch ticket to verify it exists and is resolved/closed
  const supabase = await createClient()
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, title, status, display_number')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    redirect('/tickets')
  }

  const status = ticket.status as string
  if (status !== 'resolved' && status !== 'closed') {
    redirect(`/tickets/${ticketId}?kb_error=not_resolved`)
  }

  const initialDraft = await synthesizeKBDraftFromTicket(ticketId)

  if (!initialDraft) {
    redirect(`/tickets/${ticketId}?kb_error=1`)
  }

  const ticketNumber = ticket.display_number || `#${ticketId.slice(0, 8)}`
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
                <BreadcrumbPage>New from Ticket {ticketNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1f3463]/20 to-[#2cafdd]/20 border border-white/10">
                <FilePlus className="h-5 w-5 text-[#0693D2]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd]">
                  Create Article from Ticket
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  AI-generated draft from {ticketNumber}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tickets/${ticketId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Ticket
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <KBEditorForm
          mode="create"
          existingTags={existingTags ?? []}
          createArticleAction={createArticle}
          updateArticleAction={updateArticle}
          initialDraft={initialDraft}
        />
      </div>
    </div>
  )
}
