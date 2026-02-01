/**
 * User Role Server Actions
 *
 * Isolated server action for changing user roles.
 * Split from users.ts to avoid "multiple imports from same file" build bug
 * that can cause server actions to be missing in production (Next.js #69756).
 *
 * Only super_admin can use updateUserRole.
 *
 * @module app/actions/users-role-actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import type { ActionResult } from '@/lib/types/api'
import type { User } from '@/lib/types/users'
import { updateUserRoleSchema, type UpdateUserRoleInput } from '@/lib/validations/users'

/**
 * Update user role
 * Only super_admin can use this action
 *
 * @param input - User ID and new role
 * @returns ActionResult indicating success or failure
 */
export async function updateUserRole(
  input: UpdateUserRoleInput
): Promise<ActionResult<User>> {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return { success: false, error: 'Authentication required' }
    }

    // Only super_admin can change roles
    const supabase = await createClient()
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' }
    }

    // Validate input
    const validated = updateUserRoleSchema.parse(input)

    // Update role
    const { data, error } = await supabase
      .from('users')
      .update({
        role: validated.newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.userId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating user role', { error: error.message, userId: validated.userId })
      return { success: false, error: 'Failed to update user role' }
    }

    // Log activity
    logger.info('User role updated', {
      updatedBy: currentUser.id,
      targetUserId: validated.userId,
      newRole: validated.newRole,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${validated.userId}`)

    return { success: true, data: data as User }
  } catch (error) {
    logger.error('Error in updateUserRole action', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof Error && error.message.includes('Zod')) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}
