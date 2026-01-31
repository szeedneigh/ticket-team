/**
 * Toast Hook
 *
 * Wrapper around sonner for toast notifications.
 * Toast function is memoized to prevent infinite loops when used in useEffect/useCallback dependencies.
 */

import { useCallback } from 'react'
import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
    const message = title || description || ''
    const descriptionText = title && description ? description : undefined

    if (variant === 'destructive') {
      sonnerToast.error(message, {
        description: descriptionText,
        duration,
      })
    } else {
      sonnerToast.success(message, {
        description: descriptionText,
        duration,
      })
    }
  }, [])

  return { toast }
}
