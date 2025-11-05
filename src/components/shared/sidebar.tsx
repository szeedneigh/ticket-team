"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard,
  Ticket,
  BookOpen,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  X,
  PanelLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/users'

interface SidebarProps {
  user: User
  isCollapsed: boolean
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
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

export function Sidebar({ user, isCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  )

  return (
    <>
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

      {/* Sidebar - Fixed blue gradient, isolated from shadcn theme */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobileOpen ? 280 : (isCollapsed ? 80 : 280),
        }}
        className={cn(
          // Desktop: always visible, animated width, full height
          "hidden lg:flex flex-col flex-shrink-0 bg-[linear-gradient(180deg,#002C64_48.56%,#0693D2_100%)] backdrop-blur-sm border-r border-white/10",
          "transition-all duration-100 ease-out",
          // Mobile: show as fixed overlay when open
          isMobileOpen && "!flex fixed left-0 top-0 z-50 h-screen"
        )}
      >
        {/* Mobile close button */}
        {isMobileOpen && (
          <div className="lg:hidden p-4 border-b border-white/10 flex justify-end">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center justify-center h-8 w-8 rounded-md text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Logo Section */}
        <div className="p-4 border-b border-white/10">
          <Link 
            href="/dashboard"
            className={cn(
              "flex items-center transition-colors hover:opacity-80",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.div
                  key="collapsed-logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#002C64] text-sm font-bold flex-shrink-0"
                >
                  TT
                </motion.div>
              ) : (
                <motion.span
                  key="expanded-logo"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-xl font-bold text-white"
                >
                  TicketTeam
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto min-h-0">
          {filteredNavItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center w-full h-12 px-3 rounded-md transition-colors",
                    isActive 
                      ? "bg-white text-[#002C64] font-medium" 
                      : "text-white/90 hover:bg-white/10 hover:text-white",
                    isCollapsed && "justify-center"
                  )}
                  onClick={() => isMobileOpen && setIsMobileOpen(false)}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
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
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-md bg-white/20 text-white whitespace-nowrap">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* User info */}
        <div className={cn(
          "p-4 border-t border-white/10",
          isCollapsed && "flex justify-center"
        )}>
          <AnimatePresence mode="wait">
            {isCollapsed ? (
              <motion.div
                key="collapsed-user"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#002C64] text-sm font-medium flex-shrink-0"
              >
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </motion.div>
            ) : (
              <motion.div
                key="expanded-user"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-white/10">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#002C64] text-sm font-medium flex-shrink-0">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs text-white/70 truncate capitalize">
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