/**
 * Knowledge Base Article Validation Schemas
 *
 * Zod schemas for validating KB article inputs, ensuring type safety and data integrity.
 */

import { z } from 'zod'

// ============================================================================
// Article Schema
// ============================================================================

/**
 * Schema for creating or updating a KB article
 * Used by: Article editor form, Server Actions
 */
export const kbArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),

  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(50000, 'Content must not exceed 50,000 characters'),

  summary: z
    .string()
    .min(10, 'Summary must be at least 10 characters')
    .max(500, 'Summary must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),

  category: z
    .string()
    .min(1, 'Category is required')
    .trim(),

  subcategory: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal('')),

  tags: z
    .array(z.string().min(2, 'Tag must be at least 2 characters').max(30, 'Tag must not exceed 30 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),

  status: z.enum(['draft', 'published', 'archived'], {
    errorMap: () => ({ message: 'Status must be draft, published, or archived' })
  }),

  source_ticket_id: z
    .string()
    .uuid('Invalid ticket ID')
    .nullable()
    .optional()
})

export type KBArticleInput = z.infer<typeof kbArticleSchema>

// ============================================================================
// Partial Schemas for Updates and Drafts
// ============================================================================

/**
 * Schema for updating an article (all fields optional)
 * Used by: Edit article form
 */
export const kbArticleUpdateSchema = kbArticleSchema.partial()
export type KBArticleUpdate = z.infer<typeof kbArticleUpdateSchema>

/**
 * Schema for auto-saved drafts (allows partial data)
 * Used by: Auto-save functionality, localStorage
 */
export const kbArticleDraftSchema = kbArticleSchema.partial()
export type KBArticleDraft = z.infer<typeof kbArticleDraftSchema>

// ============================================================================
// Vote Schema
// ============================================================================

/**
 * Schema for voting on an article
 * Used by: Vote buttons, Server Actions
 */
export const articleVoteSchema = z.object({
  article_id: z
    .string()
    .uuid('Invalid article ID'),

  is_helpful: z
    .boolean({
      required_error: 'Vote value is required',
      invalid_type_error: 'Vote must be true or false'
    }),

  feedback_text: z
    .string()
    .max(500, 'Feedback must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
})

export type ArticleVoteInput = z.infer<typeof articleVoteSchema>

// ============================================================================
// Search Schema
// ============================================================================

/**
 * Schema for article search filters
 * Used by: Browse page, search functionality
 */
export const articleSearchFiltersSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(20)
})

export type ArticleSearchFiltersInput = z.infer<typeof articleSearchFiltersSchema>

/**
 * Schema for semantic search
 * Used by: Semantic search API route
 */
export const semanticSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(500, 'Search query must not exceed 500 characters'),

  match_threshold: z
    .number()
    .min(0)
    .max(1)
    .default(0.7),

  match_count: z
    .number()
    .int()
    .positive()
    .max(50)
    .default(10),

  min_content_length: z
    .number()
    .int()
    .positive()
    .default(50)
})

export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>

// ============================================================================
// Helper Validation Functions
// ============================================================================

/**
 * Validate article title (for real-time validation)
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  try {
    kbArticleSchema.shape.title.parse(title)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message }
    }
    return { valid: false, error: 'Invalid title' }
  }
}

/**
 * Validate article content (for real-time validation)
 */
export function validateContent(content: string): { valid: boolean; error?: string } {
  try {
    kbArticleSchema.shape.content.parse(content)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message }
    }
    return { valid: false, error: 'Invalid content' }
  }
}

/**
 * Validate tags array (for real-time validation)
 */
export function validateTags(tags: string[]): { valid: boolean; error?: string } {
  try {
    kbArticleSchema.shape.tags.parse(tags)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message }
    }
    return { valid: false, error: 'Invalid tags' }
  }
}
