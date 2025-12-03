/**
 * Server Actions for Category Management
 *
 * Handles CRUD operations for ticket and KB categories.
 * Categories support hierarchical structure (parent_id), display ordering,
 * and type filtering (ticket, knowledge_base, both).
 *
 * @module app/actions/categories
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

interface Category {
  id: string
  name: string
  parent_id: string | null
  type: 'ticket' | 'knowledge_base' | 'both'
  is_active: boolean
  display_order: number
  created_at: string
}

interface ActionResult<T = void> {
  success?: boolean
  data?: T
  error?: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  parent_id: z.string().uuid().nullable().optional(),
  type: z.enum(['ticket', 'knowledge_base', 'both']).default('both'),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
})

const updateCategorySchema = categorySchema.partial().extend({
  id: z.string().uuid(),
})

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all categories
 *
 * @param filters - Optional filters (type, is_active)
 * @returns List of categories ordered by display_order
 */
export async function getCategories(filters?: {
  type?: 'ticket' | 'knowledge_base' | 'both'
  is_active?: boolean
}): Promise<ActionResult<Category[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    let query = supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    // Apply filters
    if (filters?.type) {
      query = query.or(`type.eq.${filters.type},type.eq.both`)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    }
  }
}

/**
 * Get a single category by ID
 *
 * @param id - Category UUID
 * @returns Category data
 */
export async function getCategory(id: string): Promise<ActionResult<Category>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch category',
    }
  }
}

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create a new category
 *
 * Requires admin role. Automatically assigns next display_order.
 *
 * @param input - Category data
 * @returns Created category
 */
export async function createCategory(
  input: z.infer<typeof categorySchema>
): Promise<ActionResult<Category>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Check user role (admin or super_admin only)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Forbidden: Admin access required' }
    }

    // Validate input
    const validated = categorySchema.parse(input)

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.display_order || 0) + 10

    // Insert category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...validated,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Revalidate pages
    revalidatePath('/admin/categories')
    revalidatePath('/admin/settings')
    revalidatePath('/tickets')
    revalidatePath('/kb')

    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a category
 *
 * Requires admin role. Can update name, type, status, and display_order.
 *
 * @param input - Updated category data (must include id)
 * @returns Updated category
 */
export async function updateCategory(
  input: z.infer<typeof updateCategorySchema>
): Promise<ActionResult<Category>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Check user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Forbidden: Admin access required' }
    }

    // Validate input
    const validated = updateCategorySchema.parse(input)
    const { id, ...updates } = validated

    // Update category
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Revalidate pages
    revalidatePath('/admin/categories')
    revalidatePath('/admin/settings')
    revalidatePath('/tickets')
    revalidatePath('/kb')

    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}

/**
 * Reorder categories
 *
 * Updates display_order for multiple categories atomically.
 *
 * @param reorderedCategories - Array of {id, display_order}
 * @returns Success status
 */
export async function reorderCategories(
  reorderedCategories: Array<{ id: string; display_order: number }>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Check user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Forbidden: Admin access required' }
    }

    // Update each category's display_order
    for (const { id, display_order } of reorderedCategories) {
      const { error } = await supabase
        .from('categories')
        .update({ display_order })
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }
    }

    // Revalidate pages
    revalidatePath('/admin/categories')
    revalidatePath('/admin/settings')
    revalidatePath('/tickets')
    revalidatePath('/kb')

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to reorder categories',
    }
  }
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete a category
 *
 * Requires admin role. Soft delete by setting is_active = false.
 * Hard delete only if no tickets/KB articles reference this category.
 *
 * @param id - Category UUID
 * @param hardDelete - If true, permanently delete (default: false)
 * @returns Success status
 */
export async function deleteCategory(
  id: string,
  hardDelete = false
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Check user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Forbidden: Admin access required' }
    }

    if (hardDelete) {
      // Check if category is in use
      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('category', id)

      const { count: kbCount } = await supabase
        .from('knowledge_articles')
        .select('id', { count: 'exact', head: true })
        .eq('category', id)

      if ((ticketCount || 0) > 0 || (kbCount || 0) > 0) {
        return {
          error: 'Cannot delete category: It is currently in use by tickets or KB articles',
        }
      }

      // Hard delete
      const { error } = await supabase.from('categories').delete().eq('id', id)

      if (error) {
        return { error: error.message }
      }
    } else {
      // Soft delete
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }
    }

    // Revalidate pages
    revalidatePath('/admin/categories')
    revalidatePath('/admin/settings')
    revalidatePath('/tickets')
    revalidatePath('/kb')

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete category',
    }
  }
}
