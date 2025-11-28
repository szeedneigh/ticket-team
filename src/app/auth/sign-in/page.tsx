/**
 * Sign In Page
 * 
 * Modern split-screen authentication page with enhanced UI/UX.
 * Left side: Brand identity, testimonials, and stats with glassmorphism.
 * Right side: Clean authentication form with entry animations.
 * 
 * @module app/auth/sign-in/page
*/

'use client'

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function SignInSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-11 w-full rounded-md" />
      <div className="space-y-2 text-center">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex flex-col md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* Mobile Back Button (Top Left) */}
      <Button asChild variant="ghost" className="absolute left-4 top-4 z-20 lg:hidden">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      {/* Mobile/Tablet Header (Centered on mobile) */}
      <div className="flex items-center justify-center p-6 z-10 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f3463] text-white shadow-sm">
           <Image
              src="/logo.svg"
              alt="TicketTeam Logo"
              width={20}
              height={20}
              className="h-5 w-5 invert brightness-0"
            />
        </div>
        <span className="ml-2 font-bold text-[#1f3463] text-lg tracking-tight">TicketTeam</span>
      </div>

      {/* Left Side: Brand Panel (Desktop Only) */}
      <div className="relative hidden h-full flex-col bg-[#1f3463] p-10 text-white dark:border-r lg:flex overflow-hidden">
        {/* Background Gradients & Patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1f3463] to-[#2cafdd]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        {/* Animated Circle Decoration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl"
        />
        
        {/* Brand Header */}
        <div className="relative z-20 flex items-center text-xl font-semibold tracking-tight">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md shadow-inner ring-1 ring-white/20">
            <Image
              src="/logo.svg"
              alt="TicketTeam Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </div>
          TicketTeam
        </div>
        
        {/* Testimonial Section */}
        <div className="relative z-20 mt-auto space-y-8">
          <motion.blockquote 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="relative">
              <span className="absolute -left-4 -top-4 text-6xl text-white/20 font-serif">“</span>
              <p className="text-xl font-light leading-relaxed text-white/90 relative z-10">
                Efficient IT support is the backbone of our educational excellence. TicketTeam streamlines our workflow so we can focus on what matters most.
              </p>
            </div>
            <footer className="text-base font-medium text-white/80">
              Management Information Systems<br />
              <span className="text-sm font-normal text-white/60">La Verdad Christian College</span>
            </footer>
          </motion.blockquote>
          
          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10"
          >
            <div className="group">
              <p className="text-3xl font-bold text-white group-hover:text-[#a9ddf6] transition-colors">24/7</p>
              <p className="text-sm font-medium text-blue-100/70 mt-1">AI-Powered Support</p>
            </div>
            <div className="group">
              <p className="text-3xl font-bold text-white group-hover:text-[#a9ddf6] transition-colors">&lt; 1hr</p>
              <p className="text-sm font-medium text-blue-100/70 mt-1">Avg. Resolution Time</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 p-4 lg:p-8 h-full flex items-center justify-center bg-background relative">
        <Button asChild variant="ghost" className="hidden lg:flex absolute right-4 top-4 md:right-8 md:top-8 z-20">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[380px] relative z-10"
        >
          <div className="flex flex-col space-y-4 text-center items-center">
            {/* Brand Logo */}
            <div className="mb-2">
               <Image
                src="/logo.svg"
                alt="TicketTeam Logo"
                width={48}
                height={48}
                className="h-12 w-12"
                priority
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in with your <strong>@laverdad.edu.ph</strong> Google account to access the dashboard.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Suspense fallback={<SignInSkeleton />}>
              <GoogleSignInButton />
            </Suspense>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-background px-2 text-muted-foreground font-medium">
                  Secure System
                </span>
              </div>
            </div>

            <p className="px-4 text-center text-xs text-muted-foreground leading-relaxed">
              By continuing, you acknowledge that you are an authorized user of the{' '}
              <span className="font-medium text-foreground">La Verdad Christian College</span> IT Infrastructure.
            </p>
          </div>
          
          {/* Footer Links */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}