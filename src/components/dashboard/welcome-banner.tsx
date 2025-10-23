"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import type { User } from '@/lib/types/users'

interface WelcomeBannerProps {
  user: User
}

export function WelcomeBanner({ user }: WelcomeBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleMessage = () => {
    switch (user.role) {
      case 'super_admin':
        return 'You have full system access and can manage all aspects of the platform.'
      case 'admin':
        return 'You can manage users, view analytics, and oversee the helpdesk system.'
      case 'staff':
        return 'You can assign tickets, create knowledge base articles, and assist users.'
      case 'employee':
        return 'You can create tickets, browse the knowledge base, and chat with Timi.'
      default:
        return 'Welcome to TicketTeam!'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-[20px] dark:bg-gray-800/90 dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#003B73] dark:text-blue-400 mb-2">
              {getGreeting()}, {user.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {getRoleMessage()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last login</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.last_login 
                  ? new Date(user.last_login).toLocaleDateString()
                  : 'First time'
                }
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
