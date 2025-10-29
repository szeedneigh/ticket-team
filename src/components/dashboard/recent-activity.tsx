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
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-primary">Recent Activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tickets">View All</Link>
          </Button>
        </div>
        
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No recent activity</p>
            </div>
          ) : (
            items.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type)
              const iconColor = getActivityColor(activity.type)
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-[12px] hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 rounded-[8px] bg-accent">
                    <IconComponent className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <strong className="font-medium text-foreground">
                        {activity.title}
                      </strong>
                      {activity.description && (
                        <span className="text-muted-foreground"> - {activity.description}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
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
