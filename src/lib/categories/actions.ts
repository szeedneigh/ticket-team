/**
 * Categories Server Actions
 *
 * Server-side actions for managing ticket and KB categories.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'

// ============================================================================
// Types
// ============================================================================

export interface Category {
  id: string
  name: string
  parent_id?: string | null
  type: 'ticket' | 'knowledge_base' | 'both'
  is_active: boolean
  display_order: number
  created_at: string
  ticket_count?: number
  article_count?: number
}

export interface CreateCategoryInput {
  name: string
  parent_id?: string | null
  type?: 'ticket' | 'knowledge_base' | 'both'
}

export interface UpdateCategoryInput {
  id: string
  name?: string
  parent_id?: string | null
  type?: 'ticket' | 'knowledge_base' | 'both'
  is_active?: boolean
}

// ============================================================================
// Get Categories
// ============================================================================

/**
 * Get all categories with optional usage counts
 */
export async function getCategories(): Promise<{
  success: boolean
  data?: Category[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return { success: false, error: error.message }
    }

    // Get usage counts for each category
    const categoriesWithCounts = await Promise.all(
      (data || []).map(async (cat) => {
        // Get ticket count
        const { count: ticketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('category', cat.name)

        // Get article count
        const { count: articleCount } = await supabase
          .from('knowledge_articles')
          .select('*', { count: 'exact', head: true })
          .eq('category', cat.name)

        return {
          ...cat,
          ticket_count: ticketCount || 0,
          article_count: articleCount || 0,
        }
      })
    )

    return { success: true, data: categoriesWithCounts }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch categories',
    }
  }
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string): Promise<{
  success: boolean
  data?: Category
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching category ${id}:`, error)
      return { success: false, error: error.message }
    }

    // Get usage counts
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('category', data.name)

    const { count: articleCount } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', data.name)

    const category = {
      ...data,
      ticket_count: ticketCount || 0,
      article_count: articleCount || 0,
    }

    return { success: true, data: category }
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch category',
    }
  }
}

// ============================================================================
// Create Category
// ============================================================================

/**
 * Create a new category
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<{
  success: boolean
  data?: Category
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check staff+ permission
    if (
      user.role !== 'staff' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      return {
        success: false,
        error: 'Unauthorized. Staff access required.',
      }
    }

    // Validate input
    if (!input.name || input.name.trim().length < 2) {
      return {
        success: false,
        error: 'Category name must be at least 2 characters',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: input.name.trim(),
        parent_id: input.parent_id || null,
        type: input.type || 'both',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'A category with this name already exists',
        }
      }
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: { ...data, ticket_count: 0, article_count: 0 },
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}

// ============================================================================
// Update Category
// ============================================================================

/**
 * Update an existing category
 */
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<{
  success: boolean
  data?: Category
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check staff+ permission
    if (
      user.role !== 'staff' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      return {
        success: false,
        error: 'Unauthorized. Staff access required.',
      }
    }

    // Validate input
    if (!input.id) {
      return { success: false, error: 'Category ID is required' }
    }

    if (input.name && input.name.trim().length < 2) {
      return {
        success: false,
        error: 'Category name must be at least 2 characters',
      }
    }

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.parent_id !== undefined) updateData.parent_id = input.parent_id
    if (input.type !== undefined) updateData.type = input.type
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating category ${input.id}:`, error)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A category with this name already exists',
        }
      }
      return { success: false, error: error.message }
    }

    // Get usage counts
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('category', data.name)

    const { count: articleCount } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', data.name)

    return {
      success: true,
      data: {
        ...data,
        ticket_count: ticketCount || 0,
        article_count: articleCount || 0,
      },
    }
  } catch (error) {
    console.error(`Error updating category:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}

// ============================================================================
// Delete Category
// ============================================================================

/**
 * Delete a category (only if no tickets or articles using it)
 */
export async function deleteCategory(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check admin permission (only admins can delete categories)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    const supabase = await createClient()

    // Get category name to check usage
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single()

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    // Check if category is in use
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name)

    const { count: articleCount } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name)

    if ((ticketCount || 0) > 0 || (articleCount || 0) > 0) {
      return {
        success: false,
        error: 'Cannot delete category that is in use',
      }
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      console.error(`Error deleting category ${id}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete category',
    }
  }
}

// ============================================================================
// Reorder Categories
// ============================================================================

/**
 * Update display order for multiple categories at once
 */
export async function reorderCategories(
  updates: Array<{ id: string; display_order: number }>
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check staff+ permission
    if (
      user.role !== 'staff' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      return {
        success: false,
        error: 'Unauthorized. Staff access required.',
      }
    }

    const supabase = await createClient()

    // Update each category's display_order
    // Note: Supabase doesn't support batch updates easily, so we do multiple updates
    const updatePromises = updates.map(({ id, display_order }) =>
      supabase
        .from('categories')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updatePromises)

    // Check if any updates failed
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error('Error reordering categories:', errors)
      return {
        success: false,
        error: `Failed to update ${errors.length} categories`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reordering categories:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reorder categories',
    }
  }
}

/**
 * Soft delete a category by marking it as inactive
 */
export async function deactivateCategory(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return updateCategory({ id, is_active: false })
}

/**
 * Reactivate a category
 */
export async function reactivateCategory(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return updateCategory({ id, is_active: true })
}
