'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertCircle, Clock, Users, ArrowRight, Filter, Sparkles } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TicketFilters } from '@/components/tickets/ticket-filters'
import { TicketList } from '@/components/tickets/ticket-list'
import type { TicketWithUser } from '@/lib/types/tickets'

interface QueuePageClientProps {
  tickets: TicketWithUser[]
  stats: {
    total: number
    critical: number
    urgent: number
    high: number
    medium: number
    oldestDays: number
  }
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
  }
  currentPriority?: string
}

export function QueuePageClient({
  tickets,
  stats,
  pagination,
  currentPriority,
}: QueuePageClientProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-full bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                  Ticket Queue
                </h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2 max-w-2xl">
                  Unassigned tickets waiting for staff assignment
                  <Sparkles className="h-4 w-4 text-[#2cafdd]" />
                </p>
              </div>
              <Button asChild variant="gradient" className="rounded-full px-6">
                <Link href="/tickets">
                  View All Tickets 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Stats Grid with Color-Coded Visual Indicators */}
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Unassigned</span>
                </div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</div>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">All tickets needing assignment</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-2xl border border-red-200/50 dark:border-red-800/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-red-500/20 animate-pulse">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Critical</span>
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.critical}</div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">System-wide impact</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-2xl border border-orange-200/50 dark:border-orange-800/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Urgent</span>
                </div>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.urgent}</div>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">Immediate attention</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 rounded-2xl border border-yellow-200/50 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">High</span>
                </div>
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.high}</div>
                <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-1">Important issues</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-2xl border border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Medium</span>
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.medium}</div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Normal priority</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-800/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gray-500/20">
                    <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Oldest</span>
                </div>
                <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.oldestDays}</div>
                <p className="text-xs text-gray-600/70 dark:text-gray-400/70 mt-1">{stats.oldestDays === 1 ? 'day old' : 'days old'}</p>
              </div>
            </motion.div>

            {/* Alerts Section */}
            {(stats.high > 5 || stats.oldestDays > 7) && (
              <motion.div variants={itemVariants} className="space-y-3">
                {stats.high > 5 && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      High volume of urgent tickets: {stats.high} tickets need immediate attention.
                    </AlertDescription>
                  </Alert>
                )}
                {stats.oldestDays > 7 && (
                  <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 backdrop-blur-sm">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      Backlog alert: The oldest ticket has been waiting for {stats.oldestDays} days.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

            {/* Main Content Card - Moved Controls here to match style but encompass list */}
            <motion.div 
              variants={itemVariants} 
              className="bg-background/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl shadow-[#1f3463]/5 overflow-hidden"
            >
              {/* Toolbar */}
              <div className="p-6 border-b border-white/5 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between bg-white/5">
                <div className="flex-1 max-w-md">
                  <TicketFilters />
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg border border-white/5 backdrop-blur-md overflow-x-auto">
                  <Filter className="h-4 w-4 text-muted-foreground ml-2 hidden sm:block" />
                  <div className="h-4 w-px bg-border hidden sm:block mx-1" />
                  
                  <Link href="/tickets/queue" className="flex-shrink-0">
                    <Button 
                      variant={!currentPriority ? 'secondary' : 'ghost'} 
                      size="sm"
                      className={`rounded-md transition-all ${!currentPriority ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      All
                    </Button>
                  </Link>
                  <Link href="/tickets/queue?priority=high" className="flex-shrink-0">
                    <Button 
                      variant={currentPriority === 'high' ? 'secondary' : 'ghost'} 
                      size="sm"
                      className={`rounded-md transition-all gap-2 ${currentPriority === 'high' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' : 'text-muted-foreground hover:text-red-500'}`}
                    >
                      High
                      <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 py-0.5 px-1.5 rounded-full text-[10px] font-bold">
                        {stats.high}
                      </span>
                    </Button>
                  </Link>
                  <Link href="/tickets/queue?priority=medium" className="flex-shrink-0">
                    <Button 
                      variant={currentPriority === 'medium' ? 'secondary' : 'ghost'} 
                      size="sm"
                      className={`rounded-md transition-all ${currentPriority === 'medium' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' : 'text-muted-foreground hover:text-amber-500'}`}
                    >
                      Medium
                      <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 py-0.5 px-1.5 rounded-full text-[10px] font-bold">
                        {stats.medium}
                      </span>
                    </Button>
                  </Link>
                  <Link href="/tickets/queue?priority=low" className="flex-shrink-0">
                    <Button 
                      variant={currentPriority === 'low' ? 'secondary' : 'ghost'} 
                      size="sm"
                      className={`rounded-md transition-all ${currentPriority === 'low' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'text-muted-foreground hover:text-green-500'}`}
                    >
                      Low
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Table Content */}
              <div className="p-2 sm:p-6 bg-background/20">
                {stats.total > 0 ? (
                  <>
                     <div className="mb-4 flex items-center justify-between px-2">
                      <p className="text-sm text-muted-foreground">
                        Showing {((pagination.currentPage - 1) * tickets.length) + 1}-{Math.min(pagination.currentPage * tickets.length, pagination.totalCount)} of {pagination.totalCount} unassigned tickets
                      </p>
                    </div>
                    <TicketList
                      tickets={tickets}
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalCount={pagination.totalCount}
                      className="bg-transparent"
                      fromQueue
                    />
                  </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="bg-primary/5 p-4 rounded-full mb-6 ring-8 ring-primary/5">
                        <Users className="h-12 w-12 text-primary/60" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Queue Cleared!</h3>
                      <p className="text-muted-foreground max-w-sm">
                        There are no unassigned tickets matching your criteria. Great job keeping the queue moving.
                      </p>
                      <Button variant="outline" className="mt-6" asChild>
                        <Link href="/tickets">View All Tickets</Link>
                      </Button>
                    </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
