/**
 * Departments Server Actions
 *
 * Server-side actions for managing organizational departments.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'

// ============================================================================
// Types
// ============================================================================

export interface Department {
  id: string
  name: string
  description?: string
  is_active: boolean
  display_order: number
  user_count?: number
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateDepartmentInput {
  name: string
  description?: string
}

export interface UpdateDepartmentInput {
  id: string
  name?: string
  description?: string
  is_active?: boolean
}

// ============================================================================
// Get Departments
// ============================================================================

/**
 * Get all departments with optional user count
 */
export async function getDepartments(): Promise<{
  success: boolean
  data?: Department[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching departments:', error)
      return { success: false, error: error.message }
    }

    // Get user counts for each department
    const departmentsWithCounts = await Promise.all(
      (data || []).map(async (dept) => {
        let userCount = 0
        try {
          const { data: countData } = await supabase.rpc(
            'get_department_user_count',
            { department_name: dept.name }
          )
          userCount = countData ?? 0
        } catch {
          // RPC may fail if not migrated; continue with 0
        }
        return {
          ...dept,
          user_count: userCount,
        }
      })
    )

    return { success: true, data: departmentsWithCounts }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch departments',
    }
  }
}

/**
 * Get a single department by ID
 */
export async function getDepartment(id: string): Promise<{
  success: boolean
  data?: Department
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching department ${id}:`, error)
      return { success: false, error: error.message }
    }

    // Get user count
    const { data: countData } = await supabase.rpc(
      'get_department_user_count',
      { department_name: data.name }
    )

    const department = {
      ...data,
      user_count: countData || 0,
    }

    return { success: true, data: department }
  } catch (error) {
    console.error(`Error fetching department ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch department',
    }
  }
}

// ============================================================================
// Create Department
// ============================================================================

/**
 * Create a new department
 */
export async function createDepartment(
  input: CreateDepartmentInput
): Promise<{
  success: boolean
  data?: Department
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    // Validate input
    if (!input.name || input.name.trim().length < 2) {
      return {
        success: false,
        error: 'Department name must be at least 2 characters',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating department:', error)
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'A department with this name already exists',
        }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: { ...data, user_count: 0 } }
  } catch (error) {
    console.error('Error creating department:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create department',
    }
  }
}

// ============================================================================
// Update Department
// ============================================================================

/**
 * Update an existing department
 */
export async function updateDepartment(
  input: UpdateDepartmentInput
): Promise<{
  success: boolean
  data?: Department
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    // Validate input
    if (!input.id) {
      return { success: false, error: 'Department ID is required' }
    }

    if (input.name && input.name.trim().length < 2) {
      return {
        success: false,
        error: 'Department name must be at least 2 characters',
      }
    }

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.description !== undefined)
      updateData.description = input.description?.trim() || null
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating department ${input.id}:`, error)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A department with this name already exists',
        }
      }
      return { success: false, error: error.message }
    }

    // Get user count
    const { data: countData } = await supabase.rpc(
      'get_department_user_count',
      { department_name: data.name }
    )

    return {
      success: true,
      data: { ...data, user_count: countData || 0 },
    }
  } catch (error) {
    console.error(`Error updating department:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update department',
    }
  }
}

// ============================================================================
// Delete Department
// ============================================================================

/**
 * Delete a department (only if no users assigned)
 */
export async function deleteDepartment(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    const supabase = await createClient()

    // Check if department can be deleted
    const { data: canDelete } = await supabase.rpc('can_delete_department', {
      department_id: id,
    })

    if (!canDelete) {
      return {
        success: false,
        error: 'Cannot delete department with assigned users',
      }
    }

    const { error } = await supabase.from('departments').delete().eq('id', id)

    if (error) {
      console.error(`Error deleting department ${id}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error deleting department ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete department',
    }
  }
}

/**
 * Soft delete a department by marking it as inactive
 */
export async function deactivateDepartment(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return updateDepartment({ id, is_active: false })
}

/**
 * Reactivate a department
 */
export async function reactivateDepartment(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return updateDepartment({ id, is_active: true })
}

// ============================================================================
// Reorder Departments
// ============================================================================

/**
 * Update display order for multiple departments at once
 */
export async function reorderDepartments(
  updates: Array<{ id: string; display_order: number }>
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    const supabase = await createClient()

    // Update each department's display_order
    // Note: Supabase doesn't support batch updates easily, so we do multiple updates
    const updatePromises = updates.map(({ id, display_order }) =>
      supabase
        .from('departments')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updatePromises)

    // Check if any updates failed
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error('Error reordering departments:', errors)
      return {
        success: false,
        error: `Failed to update ${errors.length} departments`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reordering departments:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reorder departments',
    }
  }
}
