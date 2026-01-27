/**
 * Onboarding Server Actions
 *
 * Server actions for user onboarding flow (department selection, etc.)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Update user's department (one-time only)
 *
 * @param department - The department to set
 * @returns Success status or error
 */
export async function updateUserDepartment(
  department: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return {
        success: false,
        error: 'You must be logged in to update your department',
      }
    }

    // Check if user already has a department
    const { data: existingUser } = await supabase
      .from('users')
      .select('department')
      .eq('id', authUser.id)
      .single()

    if (existingUser?.department) {
      return {
        success: false,
        error: 'Department has already been set and cannot be changed. Contact IT Support for assistance.',
      }
    }

    // Update user's department
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        department,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('Error updating department:', updateError)
      return {
        success: false,
        error: 'Failed to update department. Please try again.',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Error in updateUserDepartment:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
