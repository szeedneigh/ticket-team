/**
 * Application Constants
 * 
 * Centralized constants for the Ticket Team application.
 * Includes validation rules, limits, and configuration values.
 */

// ============================================================================
// File Upload Constants
// ============================================================================

export const FILE_UPLOAD = {
  // Maximum file size in bytes (10MB)
  MAX_SIZE: 10 * 1024 * 1024,
  
  // Maximum file size in MB (for display)
  MAX_SIZE_MB: 10,
  
  // Allowed MIME types for ticket attachments
  ALLOWED_TYPES: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    
    // Text files
    'text/plain',
    'text/csv',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
  
  // File extension to MIME type mapping (for validation)
  EXTENSIONS: {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  },
  
  // Maximum number of attachments per ticket
  MAX_ATTACHMENTS_PER_TICKET: 10,
  
  // Maximum number of attachments per comment
  MAX_ATTACHMENTS_PER_COMMENT: 5,
} as const

// ============================================================================
// Feedback Constants
// ============================================================================

export const FEEDBACK = {
  // Rating scale (1-5 stars)
  MIN_RATING: 1,
  MAX_RATING: 5,
  
  // Comment length limits
  MIN_COMMENT_LENGTH: 0, // Optional
  MAX_COMMENT_LENGTH: 1000,
  
  // Rating labels for UI
  RATING_LABELS: {
    1: 'Very Dissatisfied',
    2: 'Dissatisfied',
    3: 'Neutral',
    4: 'Satisfied',
    5: 'Very Satisfied',
  } as Record<number, string>,
  
  // Rating descriptions
  RATING_DESCRIPTIONS: {
    1: 'The support was unhelpful and did not resolve my issue',
    2: 'The support was below expectations',
    3: 'The support was acceptable but could be improved',
    4: 'The support was good and resolved my issue',
    5: 'The support was excellent and exceeded my expectations',
  } as Record<number, string>,
  
  // Feedback prompt messages
  PROMPTS: {
    TITLE: 'How was your support experience?',
    SUBTITLE: 'Your feedback helps us improve our service',
    RATING_LABEL: 'Rate your experience',
    COMMENT_LABEL: 'Additional comments (optional)',
    COMMENT_PLACEHOLDER: 'Tell us more about your experience...',
    SUBMIT_BUTTON: 'Submit Feedback',
    THANK_YOU: 'Thank you for your feedback!',
  },
} as const

// ============================================================================
// Pagination Constants
// ============================================================================

export const PAGINATION = {
  // Default page size for ticket lists
  DEFAULT_PAGE_SIZE: 20,
  
  // Page size options for user selection
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  
  // Maximum page size (prevent abuse)
  MAX_PAGE_SIZE: 100,
  
  // Default page size for comments
  COMMENTS_PAGE_SIZE: 10,
  
  // Default page size for activities
  ACTIVITIES_PAGE_SIZE: 20,
  
  // Default page size for knowledge base articles
  KB_ARTICLES_PAGE_SIZE: 12,
} as const

// ============================================================================
// Ticket Field Validation
// ============================================================================

export const TICKET_VALIDATION = {
  // Title constraints
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  
  // Description constraints
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 5000,
  
  // Resolution notes constraints
  RESOLUTION_MIN_LENGTH: 10,
  RESOLUTION_MAX_LENGTH: 5000,
  
  // Reopen reason constraints
  REOPEN_REASON_MIN_LENGTH: 10,
  REOPEN_REASON_MAX_LENGTH: 500,
  
  // Category constraints
  CATEGORY_MAX_LENGTH: 100,
  SUBCATEGORY_MAX_LENGTH: 100,
} as const

// ============================================================================
// Comment Field Validation
// ============================================================================

export const COMMENT_VALIDATION = {
  // Content constraints
  MIN_LENGTH: 1,
  MAX_LENGTH: 2000,
} as const

// ============================================================================
// Auto-Close Configuration
// ============================================================================

export const AUTO_CLOSE = {
  // Days after resolution before auto-closing
  DAYS_AFTER_RESOLVED: 7,
  
  // Enable/disable auto-close feature
  ENABLED: true,
  
  // Warning message shown to users
  WARNING_MESSAGE: 'This ticket will be automatically closed in {days} days if no further action is taken.',
} as const

// ============================================================================
// AI Integration Constants (Future)
// ============================================================================

export const AI_INTEGRATION = {
  // Maximum conversation history to send to AI
  MAX_CONVERSATION_HISTORY: 10,
  
  // Confidence threshold for AI suggestions
  CONFIDENCE_THRESHOLD: 0.7,
  
  // Maximum number of KB articles to retrieve
  MAX_KB_RESULTS: 5,
  
  // Vector similarity threshold
  SIMILARITY_THRESHOLD: 0.75,
} as const

// ============================================================================
// Notification Settings
// ============================================================================

export const NOTIFICATIONS = {
  // Notification types
  TYPES: {
    TICKET_CREATED: 'ticket_created',
    TICKET_ASSIGNED: 'ticket_assigned',
    TICKET_STATUS_CHANGED: 'ticket_status_changed',
    COMMENT_ADDED: 'comment_added',
    TICKET_RESOLVED: 'ticket_resolved',
    FEEDBACK_REQUESTED: 'feedback_requested',
  },
  
  // Notification delivery methods
  DELIVERY_METHODS: {
    IN_APP: 'in_app',
    EMAIL: 'email',
  },
} as const

// ============================================================================
// Search Configuration
// ============================================================================

export const SEARCH = {
  // Minimum search query length
  MIN_QUERY_LENGTH: 3,
  
  // Maximum search query length
  MAX_QUERY_LENGTH: 200,
  
  // Debounce delay for search input (ms)
  DEBOUNCE_DELAY: 300,
  
  // Maximum search results
  MAX_RESULTS: 50,
} as const

// ============================================================================
// Time Period Filter
// ============================================================================

export const TIME_PERIOD = {
  LABELS: {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    all: 'All Time',
  } as const,
} as const

/**
 * Get date range for a time period
 * @param period - Time period to filter by
 * @returns ISO date string for the start of the period, or null for 'all'
 */
export function getTimePeriodStartDate(period: keyof typeof TIME_PERIOD.LABELS): string | null {
  const now = new Date()

  switch (period) {
    case 'today': {
      // Start of today (00:00:00)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return startOfDay.toISOString()
    }

    case 'this_week': {
      // Start of week (Sunday 00:00:00)
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      return startOfWeek.toISOString()
    }

    case 'this_month': {
      // Start of month (1st day 00:00:00)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return startOfMonth.toISOString()
    }

    case 'all':
    default:
      return null
  }
}

// ============================================================================
// Session & Cache Configuration
// ============================================================================

export const CACHE = {
  // Cache TTL for user data (seconds)
  USER_TTL: 300, // 5 minutes
  
  // Cache TTL for ticket list (seconds)
  TICKET_LIST_TTL: 60, // 1 minute
  
  // Cache TTL for KB articles (seconds)
  KB_ARTICLE_TTL: 3600, // 1 hour
  
  // Cache TTL for categories (seconds)
  CATEGORIES_TTL: 3600, // 1 hour
} as const

// ============================================================================
// Rate Limiting
// ============================================================================

export const RATE_LIMITS = {
  // Ticket creation rate limit (per user per hour)
  TICKET_CREATION_PER_HOUR: 10,
  
  // Comment creation rate limit (per user per minute)
  COMMENT_CREATION_PER_MINUTE: 5,
  
  // Feedback submission rate limit (per user per day)
  FEEDBACK_SUBMISSION_PER_DAY: 10,
  
  // Search queries rate limit (per user per minute)
  SEARCH_QUERIES_PER_MINUTE: 30,
} as const

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  // Generic errors
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  
  // Validation errors
  INVALID_INPUT: 'Invalid input. Please check your data.',
  REQUIRED_FIELD: 'This field is required.',
  
  // File upload errors
  FILE_TOO_LARGE: `File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit.`,
  INVALID_FILE_TYPE: 'File type not allowed.',
  TOO_MANY_FILES: 'Too many files attached.',
  
  // Ticket errors
  TICKET_NOT_FOUND: 'Ticket not found.',
  CANNOT_REOPEN: 'This ticket cannot be reopened.',
  ALREADY_CLOSED: 'This ticket is already closed.',
  
  // Feedback errors
  FEEDBACK_ALREADY_SUBMITTED: 'You have already submitted feedback for this ticket.',
  CANNOT_SUBMIT_FEEDBACK: 'Feedback can only be submitted for resolved or closed tickets.',
} as const

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  TICKET_CREATED: 'Ticket created successfully.',
  TICKET_UPDATED: 'Ticket updated successfully.',
  TICKET_REOPENED: 'Ticket reopened successfully.',
  COMMENT_ADDED: 'Comment added successfully.',
  FEEDBACK_SUBMITTED: 'Thank you for your feedback!',
  ATTACHMENT_UPLOADED: 'File uploaded successfully.',
  ATTACHMENT_DELETED: 'File deleted successfully.',
} as const

