import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TicketForm } from '@/components/tickets/ticket-form'
import { getCategoriesWithSubcategories } from '@/lib/tickets/queries'
import { getPublicAttachmentConfig } from '@/lib/settings/actions'
import { Button } from '@/components/ui/button'
import type { TicketPriority } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Create New Ticket',
  description: 'Submit a new support request',
}

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent', 'critical'])

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in?redirect=/tickets/new')
  }

  let categories: Awaited<ReturnType<typeof getCategoriesWithSubcategories>> = []
  let attachmentConfig: Awaited<ReturnType<typeof getPublicAttachmentConfig>> | null = null

  try {
    ;[categories, attachmentConfig] = await Promise.all([
      getCategoriesWithSubcategories(supabase),
      getPublicAttachmentConfig(),
    ])
  } catch (error) {
    console.error('Failed to fetch categories or config:', error)
  }

  const params = await searchParams
  const rawPriority = typeof params.priority === 'string' ? params.priority : ''
  const templateDefaults = params.template
    ? {
        title: (typeof params.title === 'string' ? params.title : '') || '',
        description: (typeof params.description === 'string' ? params.description : '') || '',
        category: (typeof params.category === 'string' ? params.category : '') || '',
        priority: (VALID_PRIORITIES.has(rawPriority) ? rawPriority : 'medium') as TicketPriority,
        templateId: typeof params.template === 'string' ? params.template : undefined,
      }
    : undefined

  return (
    <div className="min-h-full bg-background relative">
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
              <Link href="/tickets">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tickets
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create New Ticket
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Submit a support request and our team will assist you as soon as possible.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-3xl relative z-10">
        <TicketForm
          categories={categories}
          attachmentConfig={attachmentConfig ?? undefined}
          templateDefaults={templateDefaults}
        />
      </div>
    </div>
  )
}
