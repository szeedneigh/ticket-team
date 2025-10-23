"use client"

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner Skeleton */}
      <Card className="p-8 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </Card>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="p-4 border border-border rounded-[12px]">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-[8px]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity Skeleton */}
      <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-[12px]">
              <Skeleton className="h-8 w-8 rounded-[8px]" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
