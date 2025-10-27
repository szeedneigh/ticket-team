/**
 * Profile Server Actions
 * 
 * Server actions for user profile management including updates and avatar uploads.
 * All actions include proper validation and error handling.
 * 
 * @module app/actions/profile
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types/api'

// Profile update schema
const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
})

/**
 * Update user profile information
 * 
 * @param formData - Form data containing profile fields
 * @returns ActionResult indicating success or failure
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Extract and validate form data
    const rawData = {
      full_name: formData.get('full_name') as string,
      position: formData.get('position') as string || undefined,
      department: formData.get('department') as string || undefined,
      phone: formData.get('phone') as string || undefined,
    }

    const validatedData = profileUpdateSchema.parse(rawData)

    const supabase = await createClient()
    
    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        full_name: validatedData.full_name,
        position: validatedData.position,
        department: validatedData.department,
        phone: validatedData.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      return { success: false, error: 'Failed to update profile' }
    }

    // Revalidate profile page
    revalidatePath('/profile')
    
    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload and update user avatar
 * 
 * @param formData - FormData containing the avatar file
 * @returns ActionResult indicating success or failure
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Extract file from FormData
    const file = formData.get('avatar') as File | null
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, error: 'File size must be less than 5MB' }
    }

    const supabase = await createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return { success: false, error: 'Failed to upload avatar' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    // Update user avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Avatar URL update error:', updateError)
      return { success: false, error: 'Failed to update avatar' }
    }

    // Revalidate profile page
    revalidatePath('/profile')
    
    return { success: true }
  } catch (error) {
    console.error('Avatar upload error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
