"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Ticket, 
  MessageSquare, 
  Clock,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { DashboardActivityItem } from '@/lib/types/dashboard'

interface RecentActivityProps {
  items: DashboardActivityItem[]
}

const getActivityIcon = (type: DashboardActivityItem['type']) => {
  switch (type) {
    case 'ticket_created':
      return Ticket
    case 'comment_added':
      return MessageSquare
    case 'status_changed':
      return CheckCircle
    default:
      return Clock
  }
}

const getActivityColor = (type: DashboardActivityItem['type']) => {
  switch (type) {
    case 'ticket_created':
      return 'text-blue-500'
    case 'comment_added':
      return 'text-green-500'
    case 'status_changed':
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
    >
      <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px] h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full" />
            Recent Activity
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/tickets">View All</Link>
          </Button>
        </div>
        
        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-accent/5 rounded-[16px] border border-dashed border-border">
              <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No recent activity</p>
              <p className="text-xs mt-1">Actions you take will appear here</p>
            </div>
          ) : (
            items.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type)
              const iconColor = getActivityColor(activity.type)
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 + index * 0.05 }}
                  className="group flex items-start gap-4 p-4 rounded-[16px] hover:bg-white/5 dark:hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
                >
                  <div className={`p-2.5 rounded-[12px] bg-accent/50 group-hover:bg-accent transition-colors`}>
                    <IconComponent className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-sm font-semibold text-foreground truncate block">
                        {activity.title}
                      </strong>
                      <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-accent/30 px-2 py-0.5 rounded-full">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </Card>
    </motion.div>
  )
}
