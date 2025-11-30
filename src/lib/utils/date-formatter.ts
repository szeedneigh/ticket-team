/**
 * Date and Time Formatting Utilities
 * Respects user preferences for date/time formats
 */

import type { UserPreferences } from '@/app/actions/preferences'

/**
 * Format a date according to user preferences
 */
export function formatDate(date: Date | string, preferences?: UserPreferences | null): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (!preferences || !preferences.date_format) {
    // Default format
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const format = preferences.date_format

  const day = dateObj.getDate()
  const month = dateObj.getMonth() + 1
  const year = dateObj.getFullYear()

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthName = monthNames[dateObj.getMonth()]

  const pad = (num: number) => num.toString().padStart(2, '0')

  switch (format) {
    case 'MM/DD/YYYY':
      return `${pad(month)}/${pad(day)}/${year}`
    case 'DD/MM/YYYY':
      return `${pad(day)}/${pad(month)}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${pad(month)}-${pad(day)}`
    case 'MMM DD, YYYY':
      return `${monthName} ${day}, ${year}`
    default:
      return dateObj.toLocaleDateString('en-US')
  }
}

/**
 * Format a time according to user preferences
 */
export function formatTime(date: Date | string, preferences?: UserPreferences | null): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const timeFormat = preferences?.time_format || '12h'

  if (timeFormat === '24h') {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format both date and time according to user preferences
 */
export function formatDateTime(date: Date | string, preferences?: UserPreferences | null): string {
  return `${formatDate(date, preferences)} ${formatTime(date, preferences)}`
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * This is independent of user preferences for consistency
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffYear > 0) {
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`
  }
  if (diffMonth > 0) {
    return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`
  }
  if (diffWeek > 0) {
    return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
  }
  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  }
  if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  }
  if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}

/**
 * Get a date range string (e.g., "Jan 1 - Jan 31, 2024")
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string,
  preferences?: UserPreferences | null
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${formatDate(start, preferences)} - ${end.getDate()}`
  }

  if (sameYear) {
    const format = preferences?.date_format || 'MMM DD, YYYY'
    if (format === 'MMM DD, YYYY') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
    }
  }

  return `${formatDate(start, preferences)} - ${formatDate(end, preferences)}`
}
