import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTicketWithRelations } from '@/lib/tickets/queries'
import { getStaffUsers } from '@/lib/users/queries'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import { PageHeader } from '@/components/shared/page-header'
import { isStaffOrAbove } from '@/lib/types/database'
import { isValidUUID } from '@/lib/utils'

/**
 * Ticket Detail Page
 *
 * Server Component that displays full ticket details including:
 * - Ticket information
 * - Comments (filtered by RLS for internal notes)
 * - Activity timeline
 * - File attachments
 * - Staff actions (if user is staff/admin/super_admin)
 */

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Ticket #${id.slice(0, 8)}`,
    description: 'View ticket details',
  }
}

export default async function TicketDetailPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise

  // Validate UUID format before attempting any operations
  if (!isValidUUID(params.id)) {
    notFound()
  }

  const supabase = await createClient()

  // 1. Authenticate user and get user details in parallel with ticket data
  const [authResult, userResult, ticketResult] = await Promise.all([
    supabase.auth.getUser(),
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      return supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single()
    })(),
    getTicketWithRelations(supabase, params.id).catch(() => null)
  ])

  const { data: { user } } = authResult

  if (!user) {
    redirect('/auth/sign-in?redirect=/tickets/' + params.id)
  }

  const { data: userData } = userResult || {}

  if (!userData) {
    redirect('/auth/sign-in')
  }

  if (!ticketResult) {
    notFound()
  }

  const { ticket, comments, activities } = ticketResult
  const userIsStaff = isStaffOrAbove(userData.role)

  // 2. Fetch attachments and staff users in parallel (attachments always, staff only if needed)
  const parallelFetches: Promise<unknown>[] = [
    supabase
      .from('attachments')
      .select(`
        id,
        filename,
        storage_path,
        mime_type,
        size_bytes,
        created_at,
        uploaded_by,
        user:users!attachments_uploaded_by_fkey(id, full_name, email)
      `)
      .eq('ticket_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }) as unknown as Promise<unknown>
  ]

  if (userIsStaff) {
    parallelFetches.push(getStaffUsers(supabase).catch(() => []))
  }

  const results = await Promise.all(parallelFetches)
  const { data: attachmentsData } = results[0] as { data: unknown }
  const staffUsers = userIsStaff ? (results[1] as Awaited<ReturnType<typeof getStaffUsers>>) : []

  // Transform attachments to match expected type
  type SupabaseAttachment = {
    id: string
    filename: string
    storage_path: string
    mime_type: string
    size_bytes: number
    created_at: string
    uploaded_by: string
    user: { id: string; full_name: string; email: string } | { id: string; full_name: string; email: string }[]
  }

  const attachments = (attachmentsData as SupabaseAttachment[] | null || []).map((att) => ({
    id: att.id,
    filename: att.filename,
    storage_path: att.storage_path,
    mime_type: att.mime_type,
    size_bytes: att.size_bytes,
    created_at: att.created_at,
    uploaded_by: att.uploaded_by,
    user: Array.isArray(att.user) ? att.user[0] : att.user
  }))

  return (
    <div className="container max-w-7xl py-8">
      <PageHeader
        title={ticket.title}
        description={`Ticket #${ticket.id.slice(0, 8)}`}
      />

      <div className="mt-8">
        <TicketDetail
          ticket={ticket}
          comments={comments.items}
          activities={activities}
          attachments={attachments || []}
          staffUsers={staffUsers}
          currentUserId={user.id}
          isStaff={userIsStaff}
        />
      </div>
    </div>
  )
}
