/**
 * Ticket Table Component
 *
 * Table view for displaying tickets with columns:
 * Ticket No., Concern, Category, Status, Date
 * Responsive: Cards on mobile, table on desktop
 */

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, isToday, isYesterday, differenceInDays } from 'date-fns'
import { Ticket as TicketIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusCell } from './status-cell'
import type { TicketWithUser } from '@/lib/types/tickets'
import { cn } from '@/lib/utils'

interface TicketTableProps {
  tickets: TicketWithUser[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  const router = useRouter()

  // Enhanced empty state
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <TicketIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No tickets found</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Try adjusting your filters or create a new ticket to get started
        </p>
        <Button asChild>
          <Link href="/tickets/new">Create New Ticket</Link>
        </Button>
      </div>
    )
  }

  // Helper function for relative date formatting
  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (differenceInDays(new Date(), date) < 7) {
      return `${differenceInDays(new Date(), date)} days ago`
    }
    return format(date, 'MM/dd/yyyy')
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {tickets.map((ticket) => {
          const ticketNumber = `Ticket# ${ticket.id.slice(0, 8).toUpperCase()}`
          const formattedDate = formatRelativeDate(ticket.created_at)

          return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block p-4 rounded-lg border bg-card hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">{ticketNumber}</p>
                  <h3 className="font-semibold mt-1">{ticket.title}</h3>
                </div>
                <StatusCell status={ticket.status} />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
                <span>{ticket.category}</span>
                <span>{formattedDate}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold w-[180px]">Ticket No.</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Concern</TableHead>
              <TableHead className="font-semibold w-[140px]">Category</TableHead>
              <TableHead className="font-semibold w-[160px]">Status</TableHead>
              <TableHead className="font-semibold w-[120px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket, index) => {
              const ticketNumber = `Ticket# ${ticket.id.slice(0, 8).toUpperCase()}`
              const formattedDate = formatRelativeDate(ticket.created_at)

              return (
                <TableRow
                  key={ticket.id}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/tickets/${ticket.id}`)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ticket ${ticketNumber} - ${ticket.title}`}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                  )}
                >
                  <TableCell className="font-semibold">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticketNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {ticket.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusCell status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formattedDate}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
