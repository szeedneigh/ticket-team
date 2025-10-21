/**
 * User Avatar Component
 * 
 * Displays user avatar with fallback to initials.
 * Optionally shows user role badge.
 * 
 * @module components/auth/user-avatar
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/lib/types/users'

interface UserAvatarProps {
  user: User
  showRole?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Display user avatar with optional role badge
 * 
 * @example
 * ```tsx
 * <UserAvatar user={user} showRole size="md" />
 * ```
 */
export function UserAvatar({ 
  user, 
  showRole = false, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }
  
  const badgeSizeClasses = {
    sm: 'text-[10px] px-1',
    md: 'text-xs',
    lg: 'text-sm',
  }
  
  // Generate initials from full name
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  const roleBadgeVariant = user.role === 'super_admin' || user.role === 'admin' 
    ? 'default' 
    : 'secondary'
  
  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      {showRole && (
        <Badge
          variant={roleBadgeVariant}
          className={`absolute -bottom-1 -right-1 ${badgeSizeClasses[size]}`}
        >
          {user.role.replace('_', ' ')}
        </Badge>
      )}
    </div>
  )
}

