  'use client'

import dynamic from 'next/dynamic'
import { Footer } from "@/components/shared/footer"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import framer-motion components
const Robot = dynamic(() => import("@/components/shared/Robot").then(mod => ({ default: mod.Robot })), {
  ssr: false,
  loading: () => null
})

const LandingAnimatedContent = dynamic(
  () => import("@/components/shared/landing-animated-content").then(mod => ({ default: mod.LandingAnimatedContent })),
  {
    ssr: false,
    loading: () => (
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100svh] p-4 md:p-6 md:ml-8">
        <div className="w-full max-w-[600px] rounded-[40px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8 md:p-14">
          {/* Logo Skeleton */}
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-6 bg-gray-200" />
          
          {/* Heading Skeleton */}
          <Skeleton className="h-8 md:h-10 w-3/4 mx-auto mb-2 rounded-lg bg-gray-200" />
          
          {/* Subheading Skeleton */}
          <Skeleton className="h-10 md:h-12 w-full mx-auto mb-6 rounded-lg bg-gray-200" />
          
          {/* Description Skeleton */}
          <div className="space-y-2 mb-10">
            <Skeleton className="h-4 w-5/6 mx-auto bg-gray-200" />
            <Skeleton className="h-4 w-2/3 mx-auto bg-gray-200" />
          </div>
          
          {/* Button Skeleton */}
          <Skeleton className="h-14 w-full rounded-[20px] bg-gray-200" />
        </div>
      </div>
    )
  }
)

export default function Home() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e]">
      <Robot />
      <LandingAnimatedContent />
      <Footer />
    </section>
  )
}
