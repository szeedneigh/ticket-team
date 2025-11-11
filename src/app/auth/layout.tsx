/**
 * Authentication Layout
 * 
 * Shared layout for all authentication pages.
 * Provides consistent branding and styling.
 * 
 * @module app/auth/layout
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication | TicketTeam',
  description: 'Sign in to TicketTeam - La Verdad Christian College IT Support',
  icons: {
    icon: "/logo.svg"
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">TicketTeam</h1>
          <p className="text-sm text-muted-foreground">
            La Verdad Christian College
          </p>
          <p className="text-xs text-muted-foreground">
            IT Support Ticket System
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

