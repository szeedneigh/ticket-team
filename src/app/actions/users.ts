/**
 * User Management Server Actions
 *
 * Server actions for user CRUD operations, role management, and bulk operations.
 * All actions include proper authorization checks and validation.
 *
 * Authorization:
 * - Admin: Can manage users except super_admin
 * - Super_admin: Full access including managing super_admins
 *
 * @module app/actions/users
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUser } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import type { ActionResult } from '@/lib/types/api'
import type { User } from '@/lib/types/users'
import {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  deactivateUserSchema,
  reactivateUserSchema,
  bulkUpdateUsersSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UpdateUserRoleInput,
  type DeactivateUserInput,
  type ReactivateUserInput,
  type BulkUpdateUsersInput,
} from '@/lib/validations/users'

// ============================================================================
// Authorization Helper Functions
// ============================================================================

/**
 * Check if user has admin or super_admin role
 */
async function isAdmin(userId: string): Promise<{ isAdmin: boolean; role: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    logger.error('Error checking admin status', { error: error?.message, userId })
    return { isAdmin: false, role: null }
  }

  return {
    isAdmin: ['admin', 'super_admin'].includes(data.role),
    role: data.role,
  }
}

/**
 * Check if user can manage a specific target user
 * Admin can manage everyone except super_admins
 * Super_admin can manage everyone
 */
async function canManageUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ canManage: boolean; currentRole: string; targetRole?: string }> {
  const supabase = await createClient()

  // Get both users' roles
  const { data: users, error } = await supabase
    .from('users')
    .select('id, role')
    .in('id', [currentUserId, targetUserId])

  if (error || !users || users.length < 2) {
    logger.error('Error fetching user roles', { error: error?.message })
    return { canManage: false, currentRole: 'employee' }
  }

  const currentUser = users.find((u) => u.id === currentUserId)
  const targetUser = users.find((u) => u.id === targetUserId)

  if (!currentUser || !targetUser) {
    return { canManage: false, currentRole: 'employee' }
  }

  // Super_admin can manage everyone
  if (currentUser.role === 'super_admin') {
    return { canManage: true, currentRole: currentUser.role, targetRole: targetUser.role }
  }

  // Admin can manage everyone except super_admin
  if (currentUser.role === 'admin' && targetUser.role !== 'super_admin') {
    return { canManage: true, currentRole: currentUser.role, targetRole: targetUser.role }
  }

  return { canManage: false, currentRole: currentUser.role, targetRole: targetUser.role }
}

// ============================================================================
// User CRUD Actions
// ============================================================================

/**
 * Create a new user
 * Only accessible by admin and super_admin
 * Admins cannot create super_admin users
 *
 * @param input - User creation data
 * @returns ActionResult with created user data
 */
export async function createUser(input: CreateUserInput): Promise<ActionResult<User>> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user is admin
    const { isAdmin: hasAdminRole, role: currentRole } = await isAdmin(user.id)
    if (!hasAdminRole) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Validate input
    const validated = createUserSchema.parse(input)

    // Check if admin is trying to create super_admin
    if (currentRole === 'admin' && validated.role === 'super_admin') {
      return { success: false, error: 'Admins cannot create super_admin users' }
    }

    // Use service client to bypass RLS for user creation
    const serviceClient = createServiceClient()

    // Check if user with this email already exists
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .single()

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Create auth user first
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: validated.full_name,
      },
    })

    if (authError || !authData.user) {
      logger.error('Error creating auth user', { error: authError?.message })
      return { success: false, error: authError?.message || 'Failed to create user account' }
    }

    // Create user profile
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: validated.email,
        full_name: validated.full_name,
        role: validated.role || 'employee',
        department: validated.department || null,
        position: validated.position || null,
        phone: validated.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      // Rollback: Delete auth user if profile creation fails
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      logger.error('Error creating user profile', { error: userError.message })
      return { success: false, error: 'Failed to create user profile' }
    }

    // Log activity
    logger.info('User created', {
      createdBy: user.id,
      newUserId: userData.id,
      newUserEmail: userData.email,
      newUserRole: userData.role,
    })

    // Revalidate users page
    revalidatePath('/admin/users')

    return { success: true, data: userData as User }
  } catch (error) {
    logger.error('Error in createUser action', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof Error && error.message.includes('Zod')) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update user profile information
 * Admins can update any user except super_admins
 * Super_admins can update anyone
 * Users can update their own profile (limited fields)
 *
 * @param userId - ID of user to update
 * @param input - Updated user data
 * @returns ActionResult indicating success or failure
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<ActionResult<User>> {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input
    const validated = updateUserSchema.parse(input)

    // Check permissions
    const isSelfUpdate = currentUser.id === userId
    if (!isSelfUpdate) {
      const { canManage } = await canManageUser(currentUser.id, userId)
      if (!canManage) {
        return { success: false, error: 'Unauthorized to update this user' }
      }
    }

    const supabase = await createClient()

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating user', { error: error.message, userId })
      return { success: false, error: 'Failed to update user' }
    }

    // Log activity
    logger.info('User updated', {
      updatedBy: currentUser.id,
      targetUserId: userId,
      changes: Object.keys(validated),
    })

    // Revalidate relevant paths
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    if (isSelfUpdate) {
      revalidatePath('/profile')
    }

    return { success: true, data: data as User }
  } catch (error) {
    logger.error('Error in updateUser action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    })

    if (error instanceof Error && error.message.includes('Zod')) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}

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
    const { role: currentRole } = await isAdmin(currentUser.id)
    if (currentRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' }
    }

    // Validate input
    const validated = updateUserRoleSchema.parse(input)

    const supabase = await createClient()

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

/**
 * Deactivate a user (soft delete)
 * Admins can deactivate users except super_admins
 * Super_admins can deactivate anyone
 *
 * @param input - User ID and optional reason
 * @returns ActionResult indicating success or failure
 */
export async function deactivateUser(input: DeactivateUserInput): Promise<ActionResult> {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input
    const validated = deactivateUserSchema.parse(input)

    // Check permissions
    const { canManage, targetRole } = await canManageUser(currentUser.id, validated.userId)
    if (!canManage) {
      return {
        success: false,
        error:
          targetRole === 'super_admin'
            ? 'Admins cannot deactivate super_admin users'
            : 'Unauthorized to deactivate this user',
      }
    }

    const supabase = await createClient()

    // Deactivate user
    const { error } = await supabase
      .from('users')
      .update({
        deactivated_at: new Date().toISOString(),
        deactivated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.userId)

    if (error) {
      logger.error('Error deactivating user', { error: error.message, userId: validated.userId })
      return { success: false, error: 'Failed to deactivate user' }
    }

    // Log activity
    logger.info('User deactivated', {
      deactivatedBy: currentUser.id,
      targetUserId: validated.userId,
      reason: validated.reason,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${validated.userId}`)

    return { success: true }
  } catch (error) {
    logger.error('Error in deactivateUser action', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof Error && error.message.includes('Zod')) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reactivate a previously deactivated user
 * Same permissions as deactivation
 *
 * @param input - User ID
 * @returns ActionResult indicating success or failure
 */
export async function reactivateUser(input: ReactivateUserInput): Promise<ActionResult> {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input
    const validated = reactivateUserSchema.parse(input)

    // Check permissions
    const { canManage } = await canManageUser(currentUser.id, validated.userId)
    if (!canManage) {
      return { success: false, error: 'Unauthorized to reactivate this user' }
    }

    const supabase = await createClient()

    // Reactivate user
    const { error } = await supabase
      .from('users')
      .update({
        deactivated_at: null,
        deactivated_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.userId)

    if (error) {
      logger.error('Error reactivating user', { error: error.message, userId: validated.userId })
      return { success: false, error: 'Failed to reactivate user' }
    }

    // Log activity
    logger.info('User reactivated', {
      reactivatedBy: currentUser.id,
      targetUserId: validated.userId,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${validated.userId}`)

    return { success: true }
  } catch (error) {
    logger.error('Error in reactivateUser action', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof Error && error.message.includes('Zod')) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk update multiple users
 * Supports bulk role change, department change, or deactivation
 *
 * @param input - User IDs and updates to apply
 * @returns ActionResult with count of affected users
 */
export async function bulkUpdateUsers(
  input: BulkUpdateUsersInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return { success: false, error: 'Authentication required' }
    }

    // Check admin access
    const { isAdmin: hasAdminRole, role: currentRole } = await isAdmin(currentUser.id)
    if (!hasAdminRole) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Validate input
    const validated = bulkUpdateUsersSchema.parse(input)

    const supabase = await createClient()

    // If admin (not super_admin), check if any target users are super_admin
    if (currentRole === 'admin') {
      const { data: targetUsers } = await supabase
        .from('users')
        .select('role')
        .in('id', validated.userIds)

      if (targetUsers?.some((u) => u.role === 'super_admin')) {
        return { success: false, error: 'Admins cannot modify super_admin users' }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (validated.updates.department) {
      updateData.department = validated.updates.department
    }

    if (validated.updates.role) {
      // Only super_admin can change roles
      if (currentRole !== 'super_admin') {
        return { success: false, error: 'Only super_admin can change user roles' }
      }
      updateData.role = validated.updates.role
    }

    if (validated.updates.deactivate !== undefined) {
      if (validated.updates.deactivate) {
        updateData.deactivated_at = new Date().toISOString()
        updateData.deactivated_by = currentUser.id
      } else {
        updateData.deactivated_at = null
        updateData.deactivated_by = null
      }
    }

    // Execute bulk update
    const { error, count } = await supabase
      .from('users')
      .update(updateData)
      .in('id', validated.userIds)

    if (error) {
      logger.error('Error in bulk update', { error: error.message })
      return { success: false, error: 'Failed to update users' }
    }

    // Log activity
    logger.info('Bulk user update', {
      updatedBy: currentUser.id,
      affectedUsers: validated.userIds,
      updates: validated.updates,
      count: count || 0,
    })

    // Revalidate users page
    revalidatePath('/admin/users')

    return { success: true, data: { count: count || 0 } }
  } catch (error) {
    logger.error('Error in bulkUpdateUsers action', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof Error && error.message.includes('Zod')) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}
