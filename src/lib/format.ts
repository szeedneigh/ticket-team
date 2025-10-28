import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Formats a numeric stat value as a string, handling null/undefined values
 * @param value - The numeric value to format
 * @returns The formatted string value, or "0" if value is null/undefined
 */
export function formatStatValue(value?: number | null): string {
  return (value ?? 0).toString()
}

