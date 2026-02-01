'use client'

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Quote, ShieldCheck } from 'lucide-react'

function SignInSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-1 text-center">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="relative min-h-[100svh] flex flex-col md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      
      {/* Mobile Header */}
      <div className="relative flex items-center justify-between p-4 z-20 lg:hidden">
        <Button asChild variant="ghost" className="-ml-2 hover:bg-[#2cafdd]/10 hover:text-[#0693D2]">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1f3463] to-[#0693D2] text-white shadow-lg shadow-[#1f3463]/20">
             <Image
                src="/logo.svg"
                alt="TicketTeam Logo"
                width={16}
                height={16}
                className="h-4 w-4 invert brightness-0"
              />
          </div>
          <span className="font-semibold text-[#1f3463] dark:text-white text-lg tracking-tight">
            TicketTeam
          </span>
        </div>
      </div>

      {/* Left Side: Professional Brand Panel */}
      <div className="relative hidden h-full flex-col p-12 text-white lg:flex overflow-hidden">
        {/* Brand Gradient - matches sidebar */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#002C64_48.56%,#0693D2_100%)]" />
        
        {/* Dot Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.08]" 
          style={{ 
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#2cafdd]/30 opacity-30 blur-[80px] rounded-full pointer-events-none" />

        {/* Brand Header */}
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
        
        {/* Testimonial Section - Clean & Trustworthy */}
        <div className="relative z-20 mt-auto max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-8 p-3 w-fit rounded-xl bg-[#2cafdd]/20 border border-[#2cafdd]/30 backdrop-blur-sm">
               <Quote className="h-5 w-5 text-[#2cafdd]" />
            </div>
            
            <blockquote className="space-y-6">
              <p className="text-2xl font-light leading-relaxed text-white/90">
                “TicketTeam has transformed how we manage campus IT. It provides the clarity and speed our department needs to support the college effectively.”
              </p>
              <footer className="flex items-center gap-4 pt-2">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-[#2cafdd]/30">
                   <ShieldCheck className="h-5 w-5 text-[#2cafdd]" />
                </div>
                <div className="text-sm">
                  <span className="font-medium text-white block">TicketTeam</span>
                  <span className="text-white/60">La Verdad Christian College</span>
                </div>
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Interface */}
      <div className="flex-1 p-4 lg:p-8 h-full flex items-center justify-center relative bg-background">
        <Button asChild variant="ghost" className="hidden lg:flex absolute right-8 top-8 z-20 text-muted-foreground hover:text-[#0693D2] hover:bg-[#2cafdd]/10">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[420px] relative z-10"  
        >
          {/* Professional Card Container */}
          <div className="bg-background rounded-2xl shadow-xl shadow-[#1f3463]/5 ring-1 ring-white/10 dark:ring-white/5 p-8 sm:p-12 border border-white/10">
            
            <div className="flex flex-col space-y-3 text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#0693D2] dark:text-white dark:bg-none">
                Log in to TicketTeam
              </h1>
              <p className="text-sm text-muted-foreground">
                Access the employee support portal
              </p>
            </div>

            <div className="grid gap-6">
              <Suspense fallback={<SignInSkeleton />}>
                <GoogleSignInButton />
              </Suspense>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#2cafdd]/20" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    Protected Area
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-5 text-xs text-muted-foreground font-medium">
               <Link href="/terms" className="hover:text-[#0693D2] transition-colors">Terms</Link>
               <Link href="/privacy" className="hover:text-[#0693D2] transition-colors">Privacy</Link>
               <Link href="/help" className="hover:text-[#0693D2] transition-colors">Help</Link>
            </div>
          </div>
          
          <p className="px-8 text-center text-xs text-muted-foreground leading-relaxed">
             &copy; {new Date().getFullYear()} La Verdad Christian College. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
