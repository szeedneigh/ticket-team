/**
 * Auto-Save Hook
 *
 * Automatically saves form data to localStorage with debouncing.
 * Provides save status for UI feedback.
 *
 * Usage:
 * ```tsx
 * const { saveStatus, lastSaved } = useAutoSave(
 *   'kb-draft-123',
 *   formData,
 *   2000
 * )
 * ```
 */

'use client'

import { useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveOptions<T> {
  enabled?: boolean
  onSave?: (data: T) => void | Promise<void>
  onError?: (error: Error) => void
}

export function useAutoSave<T>(
  key: string,
  data: T,
  delay: number = 2000,
  options: AutoSaveOptions<T> = {}
) {
  const { enabled = true, onSave, onError } = options

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const previousDataRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Convert data to string for comparison
    const dataString = JSON.stringify(data)

    // Skip if data hasn't changed
    if (dataString === previousDataRef.current) {
      return
    }

    // Skip if data is empty/initial state
    if (!data || Object.keys(data as object).length === 0) {
      return
    }

    // Set saving status immediately
    setSaveStatus('saving')

    // Debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        // Save to localStorage
        localStorage.setItem(key, dataString)
        previousDataRef.current = dataString

        // Call optional save callback
        if (onSave) {
          await onSave(data)
        }

        setSaveStatus('saved')
        setLastSaved(new Date())

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } catch (error) {
        console.error('Auto-save failed:', error)
        setSaveStatus('error')

        if (onError) {
          onError(error instanceof Error ? error : new Error('Auto-save failed'))
        }

        // Reset to idle after error
        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled, key, onSave, onError])

  const clearSaved = () => {
    try {
      localStorage.removeItem(key)
      setSaveStatus('idle')
      setLastSaved(null)
      previousDataRef.current = undefined
    } catch (error) {
      console.error('Failed to clear saved data:', error)
    }
  }

  const getSaved = (): T | null => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to retrieve saved data:', error)
      return null
    }
  }

  return {
    saveStatus,
    lastSaved,
    clearSaved,
    getSaved
  }
}
