/**
 * Settings Server Actions
 *
 * Server-side actions for managing system settings.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'

// ============================================================================
// Types
// ============================================================================

export interface SystemConfig {
  sla_response_hours: number
  sla_resolution_hours: number
  auto_assignment_enabled: boolean
  allow_ticket_reassignment: boolean
  require_resolution_notes: boolean
  max_attachment_size_mb: number
  allowed_attachment_types: string
}

export interface EmailConfig {
  smtp_enabled: boolean
  from_email: string
  from_name: string
  send_on_ticket_created: boolean
  send_on_ticket_updated: boolean
  send_on_ticket_resolved: boolean
  send_on_comment_added: boolean
}

// ============================================================================
// Get Settings
// ============================================================================

/**
 * Get a setting by key
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }

  return data?.value as T
}

/**
 * Get system configuration
 */
export async function getSystemConfig(): Promise<SystemConfig | null> {
  return getSetting<SystemConfig>('system_config')
}

/**
 * Get email configuration
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  return getSetting<EmailConfig>('email_config')
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')

  if (error) {
    console.error('Error fetching all settings:', error)
    return {}
  }

  const settings: Record<string, unknown> = {}
  for (const item of data || []) {
    settings[item.key] = item.value
  }

  return settings
}

// ============================================================================
// Update Settings
// ============================================================================

/**
 * Update a setting by key
 */
export async function updateSetting(
  key: string,
  value: unknown,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    // First check if setting exists
    const { data: existing } = await supabase
      .from('system_settings')
      .select('key')
      .eq('key', key)
      .single()

    let error
    if (existing) {
      // Update existing
      const result = await supabase
        .from('system_settings')
        .update({
          value,
          description: description || null,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('key', key)
      error = result.error
    } else {
      // Insert new
      const result = await supabase
        .from('system_settings')
        .insert({
          key,
          value,
          description: description || null,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
      error = result.error
    }

    if (error) {
      console.error(`Error updating setting ${key}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update setting',
    }
  }
}

/**
 * Update system configuration
 */
export async function updateSystemConfig(
  config: SystemConfig
): Promise<{ success: boolean; error?: string }> {
  return updateSetting('system_config', config, 'Core system configuration')
}

/**
 * Update email configuration
 */
export async function updateEmailConfig(
  config: EmailConfig
): Promise<{ success: boolean; error?: string }> {
  return updateSetting('email_config', config, 'Email notification configuration')
}

// ============================================================================
// Delete Settings
// ============================================================================

/**
 * Delete a setting by key
 */
export async function deleteSetting(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth()

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key)

    if (error) {
      console.error(`Error deleting setting ${key}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete setting',
    }
  }
}
