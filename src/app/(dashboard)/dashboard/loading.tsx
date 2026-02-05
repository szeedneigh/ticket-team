import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

export default function DashboardLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/dashboard`}>
      <DashboardSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
