"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Ticket, 
  MessageSquare, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface RecentActivityProps {
  userId: string
}

interface ActivityItem {
  id: string
  type: 'ticket_created' | 'ticket_updated' | 'comment_added' | 'status_changed'
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Mock data for now - will be replaced with real data in Phase 4
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'ticket_created',
    description: 'Created ticket #1234: Email access issue',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    type: 'status_changed',
    description: 'Ticket #1230 status changed to "In Progress"',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: '3',
    type: 'comment_added',
    description: 'Added comment to ticket #1228',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: '4',
    type: 'ticket_updated',
    description: 'Updated ticket #1225: Added priority level',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
]

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'ticket_created':
      return Ticket
    case 'ticket_updated':
      return AlertCircle
    case 'comment_added':
      return MessageSquare
    case 'status_changed':
      return CheckCircle
    default:
      return Clock
  }
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'ticket_created':
      return 'text-blue-500'
    case 'ticket_updated':
      return 'text-yellow-500'
    case 'comment_added':
      return 'text-green-500'
    case 'status_changed':
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}

const formatTimeAgo = (date: Date) => {
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

export function RecentActivity({ userId }: RecentActivityProps) {
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
            <Link href="/activity">View All</Link>
          </Button>
        </div>
        
        <div className="space-y-4">
          {mockActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No recent activity</p>
            </div>
          ) : (
            mockActivities.map((activity, index) => {
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
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
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
