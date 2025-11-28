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
    <main className="min-h-screen bg-background">
      {children}
    </main>
  )
}

