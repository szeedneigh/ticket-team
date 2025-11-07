"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/auth/user-avatar'
import { SignOutButton } from '@/components/auth/sign-out-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Bell, Search, PanelLeft } from 'lucide-react'
import type { User } from '@/lib/types/users'

interface NavbarProps {
  user?: User | null
  isCollapsed?: boolean
  setIsCollapsed?: (collapsed: boolean) => void
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

export function Navbar({
  user,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const main = document.querySelector('main')
      setScrolled((main?.scrollTop ?? 0) > 20)
    }

    const main = document.querySelector('main')
    main?.addEventListener('scroll', handleScroll)
    return () => main?.removeEventListener('scroll', handleScroll)
  }, [])

  const handleToggle = () => {
    if (window.innerWidth < 1024) {
      // Mobile: toggle mobile menu
      setIsMobileOpen?.(!isMobileOpen)
    } else {
      // Desktop: toggle collapse
      setIsCollapsed?.(!isCollapsed)
    }
  }

  return (
    <header className={cn(
      "z-50 w-full border-b flex-shrink-0 transition-all duration-300",
      scrolled
        ? "bg-background/80 backdrop-blur-xl shadow-md"
        : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-6">
          {/* Sidebar toggle button - only show when user is logged in */}
          {user && setIsCollapsed && setIsMobileOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              aria-label="Toggle sidebar"
              className="flex-shrink-0 cursor-pointer"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          
          {/* Logo - only show when user is NOT logged in */}
          {!user && (
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">TicketTeam</span>
            </Link>
          )}
          
          {!user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/kb"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Knowledge Base
              </Link>
              <Link
                href="/about"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                About
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Search placeholder */}
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Notifications with premium animation */}
              <motion.div
                whileHover={{ rotate: [0, -15, 15, -15, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {/* Notification badge - will appear when there are notifications */}
                  {/* Uncomment and set hasNotifications when implementing notification system
                  {hasNotifications && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"
                    />
                  )}
                  */}
                </Button>
              </motion.div>
              
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <UserAvatar user={user} size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <SignOutButton variant="ghost" className="w-full justify-start h-auto px-2 py-1.5">
                      Sign Out
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

