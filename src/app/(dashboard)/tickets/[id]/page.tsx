import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getTicketWithRelations } from '@/lib/tickets/queries'
import { getStaffUsers } from '@/lib/users/queries'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
              <Link href="/tickets">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tickets
              </Link>
            </Button>
          </div>

          {/* Header Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4 flex-1 min-w-0">
              {/* Ticket ID Badge */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  Ticket #{ticket.id.slice(0, 8)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </span>
              </div>
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                {ticket.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
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
