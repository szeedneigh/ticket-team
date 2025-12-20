/**
 * Sign In Page
 * 
 * Premium Professional authentication page.
 * Left side: Corporate/University trust aesthetic with deep gradients and clean typography.
 * Right side: Refined, clear authentication interface with subtle structure.
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
import { ArrowLeft, Quote, ShieldCheck } from 'lucide-react'

function SignInSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-1 text-center">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="relative min-h-[100svh] flex flex-col md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-slate-50/50">
      
      {/* Mobile Header */}
      <div className="relative flex items-center justify-between p-4 z-20 lg:hidden">
        <Button asChild variant="ghost" className="-ml-2 hover:bg-slate-100">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f172a] text-white">
             <Image
                src="/logo.svg"
                alt="TicketTeam Logo"
                width={16}
                height={16}
                className="h-4 w-4 invert brightness-0"
              />
          </div>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">
            TicketTeam
          </span>
        </div>
      </div>

      {/* Left Side: Professional Brand Panel */}
      <div className="relative hidden h-full flex-col bg-[#0f172a] p-12 text-white dark:border-r lg:flex overflow-hidden">
        {/* Deep Trust Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#172554]" />
        
        {/* Subtle Geometric Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        />

        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20 flex items-center text-xl font-medium tracking-tight"
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
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
            <div className="mb-8 p-3 w-fit rounded-xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm">
               <Quote className="h-5 w-5 text-blue-200" />
            </div>
            
            <blockquote className="space-y-6">
              <p className="text-2xl font-light leading-relaxed text-white/90">
                “TicketTeam has transformed how we manage campus IT. It provides the clarity and speed our department needs to support the college effectively.”
              </p>
              <footer className="flex items-center gap-4 pt-2">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                   <ShieldCheck className="h-5 w-5 text-blue-200" />
                </div>
                <div className="text-sm">
                  <span className="font-medium text-white block">Verified System</span>
                  <span className="text-white/60">La Verdad Christian College</span>
                </div>
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Interface */}
      <div className="flex-1 p-4 lg:p-8 h-full flex items-center justify-center relative">
        <Button asChild variant="ghost" className="hidden lg:flex absolute right-8 top-8 z-20 text-slate-500 hover:text-slate-900">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[420px] relative z-10"
        >
          {/* Professional Card Container */}
          <div className="bg-white rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] ring-1 ring-slate-100 p-8 sm:p-12">
            
            <div className="flex flex-col space-y-3 text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Sign in to TicketTeam
              </h1>
              <p className="text-sm text-slate-500">
                Access the employee support portal
              </p>
            </div>

            <div className="grid gap-6">
              <Suspense fallback={<SignInSkeleton />}>
                <GoogleSignInButton />
              </Suspense>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-white px-3 text-slate-400 font-medium">
                    Protected Area
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-5 text-xs text-slate-400 font-medium">
               <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
               <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
               <Link href="/help" className="hover:text-slate-900 transition-colors">Help</Link>
            </div>
          </div>
          
          <p className="px-8 text-center text-xs text-slate-400 leading-relaxed">
             &copy; {new Date().getFullYear()} La Verdad Christian College. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
