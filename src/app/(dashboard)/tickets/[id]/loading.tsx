/**
 * Ticket Detail Page Loading State
 * 
 * Premium skeleton UI matching the enhanced ticket detail design
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function TicketDetailLoading() {
  return (
    <div className="min-h-full bg-background relative">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Header Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4 flex-1 min-w-0">
              {/* Ticket ID Badge and Time */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              
              {/* Title */}
              <Skeleton className="h-10 w-full max-w-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header Card Skeleton */}
            <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f3463] via-[#2cafdd] to-[#1f3463]" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg bg-muted/20 p-3 border border-border/30">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card Skeleton */}
            <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2cafdd]/50 via-[#1f3463]/50 to-[#2cafdd]/50" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-6 w-36" />
                </div>
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <div className="relative flex flex-col items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        {i !== 3 && <Skeleton className="w-0.5 flex-1 mt-2" />}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Card Skeleton */}
            <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f3463]/50 via-[#2cafdd]/50 to-[#1f3463]/50" />
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-64 mt-1" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment Input */}
                <div className="rounded-xl bg-muted/20 p-4 border border-border/30">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <div className="flex justify-end gap-2 mt-4">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>

                {/* Comment List */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-6 rounded-full" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Ticket Management Card Skeleton */}
            <Card className="relative overflow-hidden bg-background/60 backdrop-blur-md border-white/10 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f3463] via-[#2cafdd] to-[#1f3463]" />
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
