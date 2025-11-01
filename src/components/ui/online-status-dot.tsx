/**
 * Online Status Dot Component
 *
 * Visual indicator showing user's online/offline status
 * - Green dot with pulse animation for online users
 * - Gray/Red dot for offline users
 * - Configurable size and position
 *
 * @module components/ui/online-status-dot
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface OnlineStatusDotProps {
  /** Whether the user is online */
  isOnline: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Whether to show pulse animation for online status */
  showPulse?: boolean
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

/**
 * Display online/offline status indicator dot
 *
 * @example
 * ```tsx
 * <OnlineStatusDot isOnline={user.is_online} size="md" />
 * ```
 */
export function OnlineStatusDot({
  isOnline,
  size = 'md',
  className = '',
  showPulse = true,
}: OnlineStatusDotProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {/* Main status dot */}
      <motion.div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          isOnline
            ? 'bg-green-500 dark:bg-green-400'
            : 'bg-gray-400 dark:bg-gray-600'
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />

      {/* Pulse ring animation for online status */}
      {isOnline && showPulse && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full bg-green-500 dark:bg-green-400',
            sizeClasses[size]
          )}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  )
}
