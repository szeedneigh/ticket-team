/**
 * Pagination defaults and limits used across list views.
 */

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  // Domain-specific defaults
  DEFAULT_PAGE_SIZE_QUEUE: 30,
  DEFAULT_PAGE_SIZE_COMMENTS: 20,

  // Page size options for user selection
  PAGE_SIZE_OPTIONS: [10, 20, 30, 50] as const,
} as const

export type PageSizeKey = keyof typeof PAGINATION


