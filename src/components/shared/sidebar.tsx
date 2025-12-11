"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard,
  Ticket,
  Library,
  Bot,
  Inbox,
  Users,
  TrendingUp,
  Settings2,
  X,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/users'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    icon: Library,
    roles: ['employee', 'staff', 'admin', 'super_admin']
  },
  {
    title: 'AI Chat',
    href: '/chat',
    icon: Bot,
    roles: ['employee', 'staff', 'admin', 'super_admin']
  },
  {
    title: 'Ticket Queue',
    href: '/tickets/queue',
    icon: Inbox,
    roles: ['staff', 'admin', 'super_admin']
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin', 'super_admin']
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    roles: ['admin', 'super_admin']
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings2,
    roles: ['super_admin']
  }
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

export function Sidebar({ user, isCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false)
    }
    // Clear pending state when navigation completes
    setPendingHref(null)
  }, [pathname, searchParams, isMobile, isMobileOpen, setIsMobileOpen])

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  )

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        key={isMobile ? 'mobile' : 'desktop'}
        initial={isMobile ? { x: isMobileOpen ? 0 : "-100%" } : false}
        animate={{
          width: isMobile ? 280 : (isCollapsed ? 80 : 280),
          x: isMobile ? (isMobileOpen ? 0 : "-100%") : 0,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
        className={cn(
          "flex flex-col flex-shrink-0 z-50",
          "bg-[linear-gradient(180deg,#002C64_48.56%,#0693D2_100%)]",
          "backdrop-blur-md border-r border-white/10",
          "h-screen",
          "fixed lg:relative",
          isMobile ? "flex left-0 top-0 shadow-2xl" : "hidden lg:flex"
        )}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute right-4 top-4 z-50">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logo Section */}
        <div className="p-6 pb-2">
          <Link 
            href="/dashboard"
            className={cn(
              "flex items-center group",
              isCollapsed && !isMobile ? "justify-center" : "gap-3"
            )}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/20 shadow-inner overflow-hidden group-hover:bg-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image src="/logo.svg" alt="TicketTeam" width={22} height={22} className="object-contain" />
            </div>
            
            <AnimatePresence mode="wait">
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                  <span className="text-xl font-bold text-white tracking-tight">TicketTeam</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0 scrollbar-none">
        {filteredNavItems.map((item, index) => {
            // Handle admin tab-based routing (e.g., /admin/users -> /admin?tab=users)
            const isAdminTabRoute = item.href.startsWith('/admin/') && item.href !== '/admin'
            
            // Check if this route matches the current path
            const isExactMatch = pathname === item.href
            const isChildMatch = pathname.startsWith(item.href + '/')
            
            // Prevent parent routes from highlighting when a more specific child route exists
            // e.g., /tickets should NOT highlight when on /tickets/queue
            const hasMoreSpecificMatch = filteredNavItems.some(other => 
              other.href !== item.href && 
              other.href.startsWith(item.href + '/') && 
              (pathname === other.href || pathname.startsWith(other.href + '/'))
            )
            
            const isActuallyActive = isAdminTabRoute
              ? pathname === '/admin' && searchParams.get('tab') === item.href.split('/admin/')[1]
              : isExactMatch || (isChildMatch && !hasMoreSpecificMatch)
            // Optimistic highlighting: show active state immediately on click
            const isActive = pendingHref === item.href || isActuallyActive
            
            const LinkContent = (
              <Link
                href={item.href}
                onClick={() => {
                  setPendingHref(item.href)
                  if (isMobileOpen) setIsMobileOpen(false)
                }}
                className={cn(
                  "relative flex items-center w-full h-12 px-3.5 rounded-xl transition-colors duration-200 group",
                  isCollapsed && !isMobile ? "justify-center px-0" : "",
                  isActive 
                    ? "text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {/* Active Background - Smooth animated pill */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                
                {/* Active Indicator (Left Border Glow) */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#22d3ee]"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    style={{ zIndex: 1 }}
                  />
                )}

                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center transition-transform duration-300",
                  isActive ? "scale-110 text-cyan-300" : "group-hover:scale-110",
                  (!isCollapsed || isMobile) && "mr-3"
                )}>
                  <item.icon className="h-[22px] w-[22px]" />
                </div>

                {/* Label */}
                <AnimatePresence>
                  {(!isCollapsed || isMobile) && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                    >
                      <span className={cn(
                        "text-[15px] font-medium transition-colors",
                        isActive ? "text-white" : "text-white/80 group-hover:text-white"
                      )}>
                        {item.title}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover Glow Effect */}
                {hoveredItem === item.href && !isActive && (
                  <motion.div
                    layoutId="hoverGlow"
                    className="absolute inset-0 bg-white/5 rounded-xl z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            )

            return (
              <div
                key={item.href}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative"
              >
                {isCollapsed && !isMobile ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {LinkContent}
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      sideOffset={5}
                      className="bg-[#002C64]/90 backdrop-blur-md text-white border-white/10 shadow-xl text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  LinkContent
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 mt-auto">
          <div className={cn(
            "relative rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-300 group",
            isCollapsed && !isMobile ? "p-2" : "p-3.5",
            "hover:bg-white/15 hover:border-white/20 hover:shadow-lg hover:shadow-black/10"
          )}>
            <div className={cn(
              "flex items-center",
              isCollapsed && !isMobile ? "justify-center" : "gap-3"
            )}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/10">
                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#002C64] rounded-full" />
              </div>

              {/* User Info */}
              {(!isCollapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-white truncate">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-white/60 truncate capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              )}

              {/* Settings/Logout Action */}
              {(!isCollapsed || isMobile) && (
                <button className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}