'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

/**
 * KB Error Toast Component
 * 
 * Displays error toasts when KB article creation fails.
 * Reads kb_error query param and shows appropriate message.
 */
export function KBErrorToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const kbError = searchParams.get('kb_error')

  useEffect(() => {
    if (kbError) {
      // Show appropriate error message based on error type
      if (kbError === 'not_resolved') {
        toast.error('Cannot create KB article', {
          description: 'The ticket must be resolved or closed before creating a KB article.',
        })
      } else {
        toast.error('Failed to create KB article', {
          description: 'An error occurred while generating the article draft. Please try again later.',
        })
      }

      // Remove the error param from URL without triggering a page reload
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('kb_error')
      const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [kbError, pathname, router, searchParams])

  return null
}
