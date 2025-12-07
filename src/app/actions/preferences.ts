/**
 * User Preferences Server Actions
 *
 * Server actions for managing user preferences including notifications,
 * appearance, localization, and dashboard settings.
 *
 * @module app/actions/preferences
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import type { ActionResult } from '@/lib/types/api'

// Notification preferences schema
const notificationPreferencesSchema = z.object({
  // Master toggles
  email_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),

  // Ticket notifications - Email
  ticket_assigned_email: z.boolean().optional(),
  ticket_comment_email: z.boolean().optional(),
  ticket_status_changed_email: z.boolean().optional(),
  ticket_priority_changed_email: z.boolean().optional(),
  mention_email: z.boolean().optional(),

  // Ticket notifications - In-App
  ticket_assigned_app: z.boolean().optional(),
  ticket_comment_app: z.boolean().optional(),
  ticket_status_changed_app: z.boolean().optional(),
  ticket_priority_changed_app: z.boolean().optional(),
  mention_app: z.boolean().optional(),

  // KB notifications - Email
  kb_article_published_email: z.boolean().optional(),
  kb_article_updated_email: z.boolean().optional(),

  // KB notifications - In-App
  kb_article_published_app: z.boolean().optional(),
  kb_article_updated_app: z.boolean().optional(),

  // Digest settings
  digest_frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).optional(),

  // Quiet hours
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
  quiet_hours_days: z.array(z.number().min(0).max(6)).optional(),
})

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>

/**
 * Get user notification preferences
 * Creates default preferences if none exist
 */
export async function getNotificationPreferences(): Promise<ActionResult<NotificationPreferences>> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supabase = await createClient()

    // Try to get existing preferences
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error fetching notification preferences', { error: error.message })
      return { success: false, error: 'Failed to fetch preferences' }
    }

    // If no preferences exist, create defaults
    if (!preferences) {
      const { data: newPreferences, error: createError } = await supabase
        .from('user_notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (createError) {
        logger.error('Error creating notification preferences', { error: createError.message })
        return { success: false, error: 'Failed to create preferences' }
      }

      return { success: true, data: newPreferences }
    }

    return { success: true, data: preferences }
  } catch (error) {
    logger.error('Get notification preferences error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate preferences
    const validatedData = notificationPreferencesSchema.parse(preferences)

    const supabase = await createClient()

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing preferences
      const { error } = await supabase
        .from('user_notification_preferences')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        logger.error('Error updating notification preferences', { error: error.message })
        return { success: false, error: 'Failed to update preferences' }
      }
    } else {
      // Insert new preferences
      const { error } = await supabase
        .from('user_notification_preferences')
        .insert({
          user_id: user.id,
          ...validatedData,
        })

      if (error) {
        logger.error('Error creating notification preferences', { error: error.message })
        return { success: false, error: 'Failed to create preferences' }
      }
    }

    // Revalidate profile page
    revalidatePath('/profile')

    return { success: true, message: 'Preferences updated successfully' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Notification preferences validation error', { errors: error.errors })
      return { success: false, error: error.errors[0].message }
    }

    logger.error('Update notification preferences error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// USER PREFERENCES (Appearance, Localization, Dashboard)
// ============================================================================

// User preferences schema
const userPreferencesSchema = z.object({
  // Appearance
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent_color: z.string().optional(),

  // Localization
  language: z.string().optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  time_format: z.enum(['12h', '24h']).optional(),

  // Dashboard Defaults
  default_ticket_filter: z.string().optional(),
  items_per_page: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]).optional(),
  default_sort_order: z.enum(['newest', 'oldest', 'priority', 'status']).optional(),
  sidebar_collapsed: z.boolean().optional(),

  // Accessibility
  reduced_motion: z.boolean().optional(),
  high_contrast: z.boolean().optional(),
  font_size: z.enum(['small', 'normal', 'large', 'extra-large']).optional(),
})

export type UserPreferences = z.infer<typeof userPreferencesSchema> & {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * Get user preferences
 * Creates default preferences if none exist
 */
export async function getUserPreferences(): Promise<ActionResult<UserPreferences>> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supabase = await createClient()

    // Try to get existing preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error fetching user preferences', { error: error.message })
      return { success: false, error: 'Failed to fetch preferences' }
    }

    // If no preferences exist, create defaults
    if (!preferences) {
      const defaultTimezone = 'UTC' // Server-side default, client will override

      const { data: newPreferences, error: createError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: 'system',
          accent_color: '#0EA5E9',
          language: 'en',
          timezone: defaultTimezone,
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          default_ticket_filter: 'all',
          items_per_page: 20,
          default_sort_order: 'newest',
          sidebar_collapsed: false,
          reduced_motion: false,
          high_contrast: false,
          font_size: 'normal'
        })
        .select()
        .single()

      if (createError) {
        logger.error('Error creating user preferences', { error: createError.message })
        return { success: false, error: 'Failed to create preferences' }
      }

      return { success: true, data: newPreferences }
    }

    return { success: true, data: preferences }
  } catch (error) {
    logger.error('Get user preferences error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: z.infer<typeof userPreferencesSchema>
): Promise<ActionResult> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate preferences
    const validatedData = userPreferencesSchema.parse(preferences)

    const supabase = await createClient()

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing preferences
      const { error } = await supabase
        .from('user_preferences')
        .update(validatedData)
        .eq('user_id', user.id)

      if (error) {
        logger.error('Error updating user preferences', { error: error.message })
        return { success: false, error: 'Failed to update preferences' }
      }
    } else {
      // Insert new preferences
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...validatedData,
        })

      if (error) {
        logger.error('Error creating user preferences', { error: error.message })
        return { success: false, error: 'Failed to create preferences' }
      }
    }

    // Revalidate profile page
    revalidatePath('/profile')

    return { success: true, message: 'Preferences updated successfully' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('User preferences validation error', { errors: error.errors })
      return { success: false, error: error.errors[0].message }
    }

    logger.error('Update user preferences error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Auto-detect timezone (client-side placeholder)
 * Actual detection happens on the client
 */
export async function autoDetectTimezone(): Promise<ActionResult<{ timezone: string }>> {
  return {
    success: true,
    data: { timezone: 'UTC' },
    message: 'Use client-side detection'
  }
}
