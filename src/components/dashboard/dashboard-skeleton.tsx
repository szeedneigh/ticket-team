import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-1">
      {/* Welcome Banner Skeleton - matches WelcomeBanner structure */}
      <Card className="relative overflow-hidden border-0 shadow-elev-3 rounded-[32px] bg-card/90 backdrop-blur-sm">
        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
          {/* Left Section: Role badge + Greeting */}
          <div className="space-y-2 max-w-2xl">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-8 w-48 md:h-9 md:w-64" />
          </div>
          {/* Right Section: Time + Date cards */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto min-w-[240px]">
            <div className="flex gap-4 w-full">
              <Skeleton className="flex-1 h-[72px] rounded-[20px]" />
              <Skeleton className="flex-1 h-[72px] rounded-[20px]" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Bento Grid - matches page.tsx layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column - Stats + Trend Chart */}
        <div className="md:col-span-8 space-y-6">
          {/* Key Metrics Row - 2 StatsCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
              >
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </Card>
            ))}
          </div>

          {/* Secondary Metrics Row - 2 StatsCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]"
              >
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </Card>
            ))}
          </div>

          {/* Ticket Volume Trend Chart Skeleton */}
          <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px] overflow-hidden">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </Card>
        </div>

        {/* Right Column - Category Chart + Recent Activity */}
        <div className="md:col-span-4 space-y-6">
          {/* Tickets by Priority (Donut) Chart Skeleton */}
          <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px] overflow-hidden">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center justify-center">
              <Skeleton className="h-[250px] w-[250px] rounded-full" />
            </div>
          </Card>

          {/* Recent Activity Skeleton */}
          <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-[24px]">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-[16px]">
                  <Skeleton className="h-10 w-10 rounded-[12px] shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
