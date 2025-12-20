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
import { motion } from 'framer-motion'

interface TicketTableProps {
  tickets: TicketWithUser[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  const router = useRouter()

  // Enhanced empty state
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20">
        <div className="rounded-full bg-muted/50 p-6 mb-4 ring-1 ring-white/10">
          <TicketIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Try adjusting your filters or create a new ticket to get started
        </p>
        <Button asChild className="rounded-full px-6 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
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
    return format(date, 'MMM d, yyyy')
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {tickets.map((ticket) => {
          const ticketNumber = `Ticket# ${ticket.id.slice(0, 8).toUpperCase()}`
          const formattedDate = formatRelativeDate(ticket.created_at)

          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link
                href={`/tickets/${ticket.id}`}
                className="block p-5 rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md hover:bg-[#2cafdd]/5 hover:border-[#2cafdd]/30 transition-all active:scale-[0.98] shadow-sm hover:shadow-lg hover:shadow-[#2cafdd]/10 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-xs text-muted-foreground tracking-wider uppercase group-hover:text-[#2cafdd] transition-colors">{ticketNumber}</p>
                    <h3 className="font-semibold mt-1 text-lg leading-tight group-hover:text-foreground transition-colors">{ticket.title}</h3>
                  </div>
                  <StatusCell status={ticket.status} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t border-white/10 group-hover:border-[#2cafdd]/20 transition-colors">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2cafdd]/50" />
                    {ticket.category}
                  </span>
                  <span>{formattedDate}</span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-hidden rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-xl shadow-[#1f3463]/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
              <TableHead className="font-semibold w-[180px] h-14 text-muted-foreground">Ticket No.</TableHead>
              <TableHead className="font-semibold min-w-[200px] h-14 text-muted-foreground">Concern</TableHead>
              <TableHead className="font-semibold w-[160px] h-14 text-muted-foreground">Category</TableHead>
              <TableHead className="font-semibold w-[160px] h-14 text-muted-foreground">Status</TableHead>
              <TableHead className="font-semibold w-[140px] h-14 text-right pr-6 text-muted-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
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
                  className="cursor-pointer transition-all hover:bg-[#2cafdd]/5 border-b border-white/5 last:border-0 group"
                >
                  <TableCell className="font-medium text-muted-foreground group-hover:text-[#2cafdd] transition-colors py-5">
                    <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded-md border border-white/10 group-hover:border-[#2cafdd]/30 transition-colors">
                      {ticketNumber}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium py-5">
                    <span className="line-clamp-1 group-hover:text-foreground transition-colors text-base">
                      {ticket.title}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 group-hover:border-[#2cafdd]/20 group-hover:text-[#2cafdd] transition-colors">
                      {ticket.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <StatusCell status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-right pr-6 py-5">
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{formattedDate}</span>
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
