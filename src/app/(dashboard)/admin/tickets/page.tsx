/**
 * Legacy admin tickets URL — redirects to staff-accessible All Tickets route.
 */

import { redirect } from 'next/navigation'

export default function AdminTicketsRedirectPage() {
  redirect('/tickets/all')
}
