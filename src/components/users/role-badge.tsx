/**
 * Role Badge Component
 *
 * Visual indicator for user roles with color coding
 * Used throughout the user management interface
 */

import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/types/database'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

const roleConfig: Record<
  UserRole,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className: string
  }
> = {
  employee: {
    label: 'Employee',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-700 border-gray-300',
  },
  staff: {
    label: 'Staff',
    variant: 'secondary',
    className: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  admin: {
    label: 'Admin',
    variant: 'default',
    className: 'bg-purple-50 text-purple-700 border-purple-300',
  },
  super_admin: {
    label: 'Super Admin',
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 border-red-300',
  },
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]

  return (
    <Badge
      variant={config.variant}
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
