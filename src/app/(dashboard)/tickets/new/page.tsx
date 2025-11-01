import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TicketForm } from '@/components/tickets/ticket-form'
import { getCategoriesWithSubcategories } from '@/lib/tickets/queries'
import { PageHeader } from '@/components/shared/page-header'

/**
 * New Ticket Page
 *
 * Server Component that allows authenticated users to create new support tickets.
 * Fetches categories from the database and renders the ticket creation form.
 */

export const metadata: Metadata = {
  title: 'Create New Ticket',
  description: 'Submit a new support request',
}

export default async function NewTicketPage() {
  // 1. Authenticate user
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in?redirect=/tickets/new')
  }

  // 2. Fetch categories with subcategories
  let categories: Awaited<ReturnType<typeof getCategoriesWithSubcategories>> = []

  try {
    categories = await getCategoriesWithSubcategories(supabase)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    // Continue with empty categories - form will show error state
  }

  return (
    <div className="container max-w-4xl py-8">
      <PageHeader
        title="Create New Ticket"
        description="Submit a support request and our team will assist you as soon as possible."
      />

      <div className="mt-8">
        <TicketForm categories={categories} />
      </div>
    </div>
  )
}
