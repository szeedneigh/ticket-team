import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/profile-client'
import { logger } from '@/lib/logger'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch user's ticket statistics
  let ticketStats = undefined

  try {
    const [totalResult, openResult, resolvedResult] = await Promise.all([
      supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['open', 'in_progress']),
      supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'resolved'),
    ])

    ticketStats = {
      total: totalResult.count || 0,
      open: openResult.count || 0,
      resolved: resolvedResult.count || 0,
    }
  } catch (error) {
    logger.error('Error fetching ticket stats', { error: error instanceof Error ? error.message : 'Unknown error' })
    // Continue without stats
  }

  return (
    <div className="space-y-8">
      <ProfileClient user={user} ticketStats={ticketStats} />
    </div>
  )
}
