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
      <div className="relative z-10 grid place-content-center min-h-[100svh] p-6 md:ml-8">
        <div className="w-full max-w-[600px] rounded-[40px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-10 md:p-14">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-6" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-16 w-full mb-10" />
          <Skeleton className="h-12 w-full" />
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
