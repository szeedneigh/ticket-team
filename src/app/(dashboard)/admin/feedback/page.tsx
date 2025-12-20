/**
 * Feedback Management Page
 *
 * Redirects to Settings tab for Feedback
 */

import { redirect } from 'next/navigation'

export default function FeedbackPage() {
  redirect('/admin/settings?tab=feedback')
}
