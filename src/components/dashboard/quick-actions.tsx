"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  BookOpen, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings,
  FileText,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import type { User } from '@/lib/types/users'

interface QuickActionsProps {
  user: User
}

interface ActionItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

export function QuickActions({ user }: QuickActionsProps) {
  const getActionsForRole = (role: string): ActionItem[] => {
    const baseActions: ActionItem[] = [
      {
        title: 'Create Ticket',
        description: 'Submit a new support request',
        icon: Plus,
        href: '/tickets/new',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      },
      {
        title: 'Knowledge Base',
        description: 'Browse helpful articles',
        icon: BookOpen,
        href: '/kb',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      },
      {
        title: 'Chat with Timi',
        description: 'Get instant AI assistance',
        icon: MessageSquare,
        href: '/chat',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      }
    ]

    const staffActions: ActionItem[] = [
      {
        title: 'Ticket Queue',
        description: 'View and assign tickets',
        icon: UserCheck,
        href: '/tickets/queue',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      },
      {
        title: 'Create Article',
        description: 'Add to knowledge base',
        icon: FileText,
        href: '/kb/new',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      }
    ]

    const adminActions: ActionItem[] = [
      {
        title: 'Manage Users',
        description: 'User administration',
        icon: Users,
        href: '/admin/users',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      },
      {
        title: 'Analytics',
        description: 'View system reports',
        icon: BarChart3,
        href: '/analytics',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      },
      {
        title: 'Settings',
        description: 'System configuration',
        icon: Settings,
        href: '/admin/settings',
        color: 'bg-[#0693D2] hover:bg-[#0693D2]/90'
      }
    ]

    switch (role) {
      case 'super_admin':
        return [...baseActions, ...staffActions, ...adminActions]
      case 'admin':
        return [...baseActions, ...staffActions, ...adminActions]
      case 'staff':
        return [...baseActions, ...staffActions]
      default:
        return baseActions
    }
  }

  const actions = getActionsForRole(user.role)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
    >
      <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px] h-full">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 + index * 0.05 }}
            >
              <Button
                asChild
                variant="ghost"
                className="w-full h-auto p-4 justify-start text-left hover:bg-white/5 dark:hover:bg-white/5 border border-transparent hover:border-white/10 rounded-[16px] transition-all duration-200 group"
              >
                <Link href={action.href}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-[12px] ${action.color} text-white shadow-md transition-transform duration-200`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                  </div>
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
