/**
 * Onboarding Layout Component
 *
 * Client wrapper for the department onboarding page layout.
 * Provides split-panel design with brand panel and motion animations.
 *
 * @module components/onboarding/onboarding-layout
 */

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="relative min-h-[100svh] flex flex-col md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      {/* Left Side: Brand Panel (hidden on mobile) */}
      <div className="relative hidden h-full flex-col p-12 text-white lg:flex overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#002C64_48.56%,#0693D2_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#2cafdd]/30 opacity-30 blur-[80px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20 flex items-center text-xl font-medium tracking-tight"
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <Image
              src="/logo.svg"
              alt="TicketTeam Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </div>
          <span className="text-white/95">TicketTeam</span>
        </motion.div>

        <div className="relative z-20 mt-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-light leading-relaxed text-white/90 mb-4">
              Complete your profile
            </h2>
            <p className="text-white/70 leading-relaxed">
              Select your department to get started. This helps us route your
              support requests and connect you with the right team.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Content */}
      <div className="flex-1 p-4 lg:p-8 h-full flex items-center justify-center relative bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[480px] lg:max-w-lg relative z-10"
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1f3463] to-[#0693D2] text-white shadow-lg shadow-[#1f3463]/20">
              <Image
                src="/logo.svg"
                alt="TicketTeam Logo"
                width={18}
                height={18}
                className="h-[18px] w-[18px] invert brightness-0"
              />
            </div>
            <span className="font-semibold text-[#1f3463] dark:text-white text-lg tracking-tight">
              TicketTeam
            </span>
          </div>

          {children}

          <p className="px-4 text-center text-xs text-muted-foreground leading-relaxed">
            &copy; {new Date().getFullYear()} La Verdad Christian College
          </p>
        </motion.div>
      </div>
    </div>
  )
}
