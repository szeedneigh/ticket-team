  "use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Ticket,
  BookOpen,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/users'

interface SidebarProps {
  user: User
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['employee', 'staff', 'admin', 'super_admin']
  },
  {
    title: 'My Tickets',
    href: '/tickets',
    icon: Ticket,
    roles: ['employee', 'staff', 'admin', 'super_admin']
  },
  {
    title: 'Knowledge Base',
    href: '/kb',
    icon: BookOpen,
    roles: ['employee', 'staff', 'admin', 'super_admin']
  },
  {
    title: 'AI Chat',
    href: '/chat',
    icon: MessageSquare,
    roles: ['employee', 'staff', 'admin', 'super_admin']
  },
  {
    title: 'Ticket Queue',
    href: '/tickets/queue',
    icon: Users,
    roles: ['staff', 'admin', 'super_admin'],
    badge: 'Staff+'
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin', 'super_admin'],
    badge: 'Admin+'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['admin', 'super_admin'],
    badge: 'Admin+'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['super_admin'],
    badge: 'Super Admin'
  }
]

export function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  )

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
        }}
        className={cn(
          "hidden lg:flex flex-col bg-background/90 backdrop-blur-sm border-r border-border",
          "transition-all duration-300 ease-in-out",
          isMobileOpen && "lg:hidden flex fixed left-0 top-0 z-50 h-full w-80"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <h2 className="text-lg font-semibold text-primary">Navigation</h2>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="hidden lg:flex"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Button
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-12",
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-primary/5 text-foreground",
                    isCollapsed && "px-3"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex items-center justify-between flex-1 overflow-hidden"
                        >
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </Button>
              </motion.div>
            )
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-accent">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  )
}