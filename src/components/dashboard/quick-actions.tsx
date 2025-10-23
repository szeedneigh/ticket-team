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
        href: '/admin/analytics',
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
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <h2 className="text-xl font-semibold text-primary mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 + index * 0.1 }}
            >
              <Button
                asChild
                variant="ghost"
                className="w-full h-auto p-4 justify-start text-left hover:bg-primary/5"
              >
                <Link href={action.href}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-[8px] ${action.color} text-white`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
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
