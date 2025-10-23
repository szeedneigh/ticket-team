"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Ticket, 
  CheckCircle, 
  Clock, 
  Star,
  TrendingUp,
  TrendingDown,
  LucideIcon
} from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: string
  trend?: string
  trendDirection?: 'up' | 'down'
  loading?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Ticket,
  CheckCircle,
  Clock,
  Star,
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = 'up',
  loading = false 
}: StatsCardProps) {
  const IconComponent = iconMap[icon] || Ticket

  if (loading) {
    return (
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px] hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-primary">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${
                  trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-[12px]">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
