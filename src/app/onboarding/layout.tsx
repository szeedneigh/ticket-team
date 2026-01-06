/**
 * Onboarding Layout
 * 
 * Shared layout for onboarding pages.
 * Provides consistent styling without dashboard navigation.
 * 
 * @module app/onboarding/layout
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding | TicketTeam',
  description: 'Complete your profile setup',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-muted/30">
      {children}
    </main>
  )
}

