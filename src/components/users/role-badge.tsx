/**
 * Role Badge Component
 *
 * Visual indicator for user roles with color coding
 * Used throughout the user management interface
 */

import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/types/database'
import { ROLE_BADGE_STYLES } from '@/lib/constants/colors'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_BADGE_STYLES[role]

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className || ''} font-medium`}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Role description helper
 * Returns a brief description of what each role can do
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    employee: 'Can submit tickets and view their own tickets',
    staff: 'Can manage assigned tickets and create knowledge base articles',
    admin: 'Can manage users (except super admins) and view analytics',
    super_admin: 'Full system access including all admin functions',
  }

  return descriptions[role]
}
