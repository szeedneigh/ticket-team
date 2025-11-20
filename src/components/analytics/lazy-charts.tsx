/**
 * Lazy-Loaded Analytics Charts
 *
 * Client component wrappers that lazy-load heavy chart components
 * to reduce initial bundle size and improve page load performance.
 */

'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { TrendChartProps, CategoryChartProps, BarChartProps } from './index'

// Lazy load TrendChart component
export const LazyTrendChart = dynamic<TrendChartProps>(
  () => import('./trend-chart').then((mod) => mod.TrendChart),
  {
    loading: () => (
      <div className="rounded-lg border">
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Lazy load MultiLineTrendChart component
export const LazyMultiLineTrendChart = dynamic(
  () => import('./trend-chart').then((mod) => mod.MultiLineTrendChart),
  {
    loading: () => (
      <div className="rounded-lg border">
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Lazy load CategoryChart component
export const LazyCategoryChart = dynamic<CategoryChartProps>(
  () => import('./category-chart').then((mod) => mod.CategoryChart),
  {
    loading: () => (
      <div className="rounded-lg border">
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Lazy load BarChart component
export const LazyBarChart = dynamic<BarChartProps>(
  () => import('./bar-chart').then((mod) => mod.BarChart),
  {
    loading: () => (
      <div className="rounded-lg border">
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Lazy load StackedBarChart component
export const LazyStackedBarChart = dynamic(
  () => import('./bar-chart').then((mod) => mod.StackedBarChart),
  {
    loading: () => (
      <div className="rounded-lg border">
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
)
