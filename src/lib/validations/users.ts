/**
 * User Validation Schemas
 *
 * Zod validation schemas for user management operations.
 * Includes schemas for create, update, role changes, and filters.
 *
 * @module lib/validations/users
 */

import { z } from 'zod'

// ============================================================================
// User Role Schema
// ============================================================================

export const userRoleSchema = z.enum(['employee', 'staff', 'admin', 'super_admin'], {
  errorMap: () => ({ message: 'Invalid user role' }),
})

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validates La Verdad email addresses
 * Accepts: @laverdad.edu.ph and @student.laverdad.edu.ph
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .refine(
    (email) =>
      email.endsWith('@laverdad.edu.ph') || email.endsWith('@student.laverdad.edu.ph'),
    {
      message: 'Email must be from @laverdad.edu.ph or @student.laverdad.edu.ph domain',
    }
  )

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validates Philippine phone numbers
 * Accepts: +63 format, 09 format, or local format
 */
const phoneSchema = z
  .string()
  .regex(
    /^(\+63|0)[0-9]{10}$|^[0-9]{7}$/,
    'Invalid phone number. Use format: +639XXXXXXXXX or 09XXXXXXXXX'
  )
  .optional()
  .or(z.literal(''))

// ============================================================================
// Create User Schema
// ============================================================================

/**
 * Schema for creating a new user
 * Used by admin to manually create user accounts
 */
export const createUserSchema = z.object({
  email: emailSchema,
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Full name can only contain letters, spaces, and basic punctuation'),
  role: userRoleSchema.default('employee'),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional(),
  position: z.string().max(100, 'Position must not exceed 100 characters').optional(),
  phone: phoneSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ============================================================================
// Update User Schema
// ============================================================================

/**
 * Schema for updating user profile information
 * Excludes email and role (those have separate actions)
 */
export const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Full name can only contain letters, spaces, and basic punctuation')
    .optional(),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional(),
  position: z.string().max(100, 'Position must not exceed 100 characters').optional(),
  phone: phoneSchema,
  avatar_url: z.string().url('Invalid avatar URL').optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ============================================================================
// Update User Role Schema
// ============================================================================

/**
 * Schema for changing user role
 * Only super_admin can use this action
 */
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newRole: userRoleSchema,
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>

// ============================================================================
// Deactivate User Schema
// ============================================================================

/**
 * Schema for deactivating (soft-deleting) a user
 */
export const deactivateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
})

export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>

// ============================================================================
// Reactivate User Schema
// ============================================================================

/**
 * Schema for reactivating a previously deactivated user
 */
export const reactivateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export type ReactivateUserInput = z.infer<typeof reactivateUserSchema>

// ============================================================================
// Bulk Update Users Schema
// ============================================================================

/**
 * Schema for bulk operations on multiple users
 */
export const bulkUpdateUsersSchema = z.object({
  userIds: z.array(z.string().uuid('Invalid user ID')).min(1, 'At least one user must be selected'),
  updates: z.object({
    department: z.string().max(100).optional(),
    role: userRoleSchema.optional(),
    deactivate: z.boolean().optional(),
  }),
})

export type BulkUpdateUsersInput = z.infer<typeof bulkUpdateUsersSchema>

// ============================================================================
// User Filters Schema
// ============================================================================

/**
 * Schema for filtering and searching users
 */
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  department: z.string().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(20),
})

export type UserFiltersInput = z.infer<typeof userFiltersSchema>

// ============================================================================
// User Search Schema (simplified)
// ============================================================================

/**
 * Schema for quick user search (autocomplete, etc.)
 */
export const userSearchSchema = z.object({
  query: z.string().min(1, 'Search query must not be empty'),
  limit: z.number().int().positive().max(50).default(10),
  include_deactivated: z.boolean().default(false),
})

export type UserSearchInput = z.infer<typeof userSearchSchema>
