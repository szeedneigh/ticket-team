import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTicketWithRelations } from '@/lib/tickets/queries'
import { getStaffUsers } from '@/lib/users/queries'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import { PageHeader } from '@/components/shared/page-header'
import { isStaffOrAbove } from '@/lib/types/database'

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
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in?redirect=/tickets/' + params.id)
  }

  // 2. Get user details for role checking
  const { data: userData } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/auth/sign-in')
  }

  const userIsStaff = isStaffOrAbove(userData.role)

  // 3. Fetch ticket with all relations
  let ticketData
  try {
    ticketData = await getTicketWithRelations(supabase, params.id)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    notFound()
  }

  if (!ticketData) {
    notFound()
  }

  const { ticket, comments, activities } = ticketData

  // 4. Fetch attachments
  const { data: attachmentsData } = await supabase
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
    .order('created_at', { ascending: true })

  // Transform attachments to match expected type
  // Supabase sometimes returns user as array, we need to flatten it
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

  // 5. Fetch staff users for assignment dropdown (only if user is staff)
  let staffUsers: Awaited<ReturnType<typeof getStaffUsers>> = []
  if (userIsStaff) {
    try {
      staffUsers = await getStaffUsers(supabase)
    } catch (error) {
      console.error('Error fetching staff users:', error)
      // Continue without staff users
    }
  }

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
