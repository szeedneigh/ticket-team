"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { Search, PanelLeft } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
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
    )} suppressHydrationWarning>
      <div className="flex h-16 items-center justify-between px-4 lg:px-6" suppressHydrationWarning>
        <div className="flex items-center gap-6" suppressHydrationWarning>
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
                href="/help"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Help
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Notifications */}
              <NotificationBell />
              
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
                    <Link href="/help">Help Center</Link>
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

