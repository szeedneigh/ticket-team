/**
 * Users View Loading Skeleton
 *
 * Skeleton component that mirrors the User Management page layout
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function UsersViewSkeleton() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-12">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Header Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4">
              <Skeleton className="h-14 w-80 md:w-96" />
              <Skeleton className="h-6 w-64 md:w-80" />
            </div>
            
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          {/* Filters Section - matches UserFilters: search (flex-1) + filter row */}
          <div className="flex flex-col gap-6 bg-background/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-[#1f3463]/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Skeleton className="h-10 flex-1 w-full" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-10 w-[140px]" />
                <Skeleton className="h-10 w-[160px]" />
                <Skeleton className="h-10 w-[140px]" />
                <Skeleton className="h-10 w-[150px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg shadow-[#1f3463]/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table Section - matches UserTable: p-0, space-y-4, rounded-md border Table, pagination */}
        <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-lg shadow-[#1f3463]/5 overflow-hidden">
          <div className="p-0">
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Skeleton className="h-4 w-4 rounded" />
                      </TableHead>
                      <TableHead className="w-12" />
                      <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                      <TableHead className="w-12">
                        <Skeleton className="h-4 w-4 rounded ml-auto" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-14 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-14 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination - matches UserTable: flex-col items-center gap-3 pb-6 pt-2 */}
              <div className="flex flex-col items-center gap-3 pb-6 pt-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
