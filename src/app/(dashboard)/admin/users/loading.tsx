/**
 * Loading state for User Management page
 * Uses the same skeleton as UsersView so layout stays aligned (no jump when content loads).
 */

import { UsersViewSkeleton } from '@/components/admin/users-view-skeleton'
import {
  SkeletonOnlyOnFirstVisit,
  SKELETON_VISITED_PREFIX,
} from '@/components/shared/skeleton-only-on-first-visit'

export default function UsersLoading() {
  return (
    <SkeletonOnlyOnFirstVisit storageKey={`${SKELETON_VISITED_PREFIX}/admin/users`}>
      <UsersViewSkeleton />
    </SkeletonOnlyOnFirstVisit>
  )
}
