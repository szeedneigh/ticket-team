/**
 * Hook for date/time formatting with user preferences
 */

'use client'

import { usePreferences } from '@/providers/preferences-provider'
import { formatDate, formatTime, formatDateTime, formatRelativeTime, formatDateRange } from '@/lib/utils/date-formatter'
import { useCallback } from 'react'

export function useDateFormatter() {
  const { preferences } = usePreferences()

  const formatDateWithPrefs = useCallback(
    (date: Date | string) => formatDate(date, preferences),
    [preferences]
  )

  const formatTimeWithPrefs = useCallback(
    (date: Date | string) => formatTime(date, preferences),
    [preferences]
  )

  const formatDateTimeWithPrefs = useCallback(
    (date: Date | string) => formatDateTime(date, preferences),
    [preferences]
  )

  const formatDateRangeWithPrefs = useCallback(
    (startDate: Date | string, endDate: Date | string) => formatDateRange(startDate, endDate, preferences),
    [preferences]
  )

  return {
    formatDate: formatDateWithPrefs,
    formatTime: formatTimeWithPrefs,
    formatDateTime: formatDateTimeWithPrefs,
    formatRelativeTime, // No preferences needed for relative time
    formatDateRange: formatDateRangeWithPrefs,
  }
}
