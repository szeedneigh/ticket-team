/**
 * User Avatar Component
 *
 * Displays user avatar with fallback to initials
 * Supports different sizes and optional status indicator
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/types/users'

interface UserAvatarProps {
  user: Pick<User, 'full_name' | 'avatar_url' | 'email'>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showOnline?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

/**
 * Get initials from full name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function UserAvatar({
  user,
  size = 'md',
  showOnline = false,
  className,
}: UserAvatarProps) {
  const initials = getInitials(user.full_name)
  const sizeClass = sizeClasses[size]

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClass} ${className || ''}`}>
        {user.avatar_url && (
          <AvatarImage
            src={user.avatar_url}
            alt={user.full_name}
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {showOnline && (
        <span
          className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"
          aria-label="Online"
        />
      )}
    </div>
  )
}
