'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Back button for ticket detail page.
 * Uses useSearchParams to read the `from` query param from the current URL,
 * ensuring correct behavior during client-side navigation (e.g. from ticket queue).
 */
export function TicketDetailBackButton() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const fromQueue = from === 'queue'

  return (
    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
      <Link href={fromQueue ? '/tickets/queue' : '/tickets'}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {fromQueue ? 'Back to Ticket Queue' : 'Back to My Tickets'}
      </Link>
    </Button>
  )
}
