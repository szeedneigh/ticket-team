"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import type { User } from '@/lib/types/users'
import { Sparkles, Clock, Calendar } from 'lucide-react'

interface WelcomeBannerProps {
  user: User
}

export function WelcomeBanner({ user }: WelcomeBannerProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleMessage = () => {
    switch (user.role) {
      case 'super_admin':
        return 'System Overview'
      case 'admin':
        return 'Admin Dashboard'
      case 'staff':
        return 'Staff Workspace'
      case 'employee':
        return 'Employee Portal'
      default:
        return 'Dashboard'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-0 shadow-elev-3 rounded-[32px] bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/40">
        {/* Decorative gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-20 mix-blend-overlay" />
        
        {/* Decorative glow orbs - Animated */}
        <motion.div 
          className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
          {/* Left Section: Greeting & Role */}
          <div className="space-y-2 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-2 mb-2"
            >
              <span className="px-3 py-1 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                {getRoleMessage()}
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {getGreeting()}, <br className="hidden md:block" />
              <span className="text-foreground">{user.full_name?.split(' ')[0] || 'there'}</span>! 👋
            </motion.h1>
          </div>
          
          {/* Right Section: Time & Stats */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto min-w-[240px]">
            <div className="flex gap-4 w-full">
              {/* Time Card */}
              <motion.div 
                className="flex-1 flex items-center justify-between p-4 rounded-[20px] bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/20 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Time</p>
                    <p className="text-base font-bold text-foreground tabular-nums">
                      {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Date Card */}
              <motion.div 
                className="flex-1 flex items-center justify-between p-4 rounded-[20px] bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Date</p>
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {currentTime ? currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-- --'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Last Login */}
            <motion.div 
              className="flex items-center justify-center sm:justify-start lg:justify-center gap-2 px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <p className="text-xs text-muted-foreground">
                Last login: {user.last_login 
                  ? new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'First time'}
              </p>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
