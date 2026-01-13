/**
 * Onboarding Server Actions
 * 
 * Server actions for user onboarding flow, specifically department selection.
 * 
 * @module app/actions/onboarding
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

/**
 * Update user's department during onboarding
 * 
 * Validates that the selected department exists and is active,
 * then updates the user's department field.
 * 
 * @param department - The department name to assign to the user
 * @returns Object with success status and optional error message
 */
export async function updateUserDepartment(department: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Validate department exists and is active
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('id, name, is_active')
      .eq('name', department)
      .eq('is_active', true)
      .single()

    if (deptError || !deptData) {
      logger.warn('Invalid department selected during onboarding', {
        userId: user.id,
        department,
        error: deptError?.message,
      })
      return {
        success: false,
        error: 'Invalid department selected. Please choose a valid department.',
      }
    }

    // Update user's department
    const { error: updateError } = await supabase
      .from('users')
      .update({
        department: deptData.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('Error updating user department during onboarding', {
        userId: user.id,
        department,
        error: updateError.message,
      })
      return {
        success: false,
        error: 'Failed to update department. Please try again.',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/onboarding/department')
    revalidatePath('/profile')

    logger.info('User department updated during onboarding', {
      userId: user.id,
      department: deptData.name,
    })

    return { success: true }
  } catch (error) {
    logger.error('Unexpected error updating user department', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

