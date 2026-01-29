/**
 * System Diagnostics Page
 * 
 * Tests all settings functionality and displays results
 * Only accessible to admins
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiagnosticsClient } from './diagnostics-client'

export const metadata = {
  title: 'System Diagnostics | Ticket Team',
  description: 'Test system settings and configuration'
}

async function runDiagnostics() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const results = {
    timestamp: new Date().toISOString(),
    user: profile,
    checks: [] as Array<{
      name: string
      status: 'pass' | 'fail' | 'warning'
      message: string
      details?: unknown
    }>
  }

  // Check 1: System Settings Table
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')

    if (error) {
      results.checks.push({
        name: 'System Settings Table',
        status: 'fail',
        message: `Table not accessible: ${error.message}`,
        details: error
      })
    } else {
      results.checks.push({
        name: 'System Settings Table',
        status: 'pass',
        message: `Found ${settings?.length || 0} settings`,
        details: settings
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'System Settings Table',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 2: System Config
  try {
    const { data: config, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'system_config')
      .single()

    if (error) {
      results.checks.push({
        name: 'System Config Setting',
        status: 'warning',
        message: 'Not found - needs to be created',
        details: error
      })
    } else {
      results.checks.push({
        name: 'System Config Setting',
        status: 'pass',
        message: 'Configuration found',
        details: config?.value
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'System Config Setting',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 3: Email Config
  try {
    const { data: emailConfig, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'email_notifications_config')
      .single()

    if (error) {
      results.checks.push({
        name: 'Email Notifications Config',
        status: 'warning',
        message: 'Not found - needs to be created',
        details: error
      })
    } else {
      results.checks.push({
        name: 'Email Notifications Config',
        status: 'pass',
        message: 'Configuration found',
        details: emailConfig?.value
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'Email Notifications Config',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 4: Departments
  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select('id, name, is_active, display_order')
      .order('display_order')

    if (error) {
      results.checks.push({
        name: 'Departments Table',
        status: 'fail',
        message: `Error: ${error.message}`,
        details: error
      })
    } else {
      results.checks.push({
        name: 'Departments Table',
        status: departments && departments.length > 0 ? 'pass' : 'warning',
        message: `Found ${departments?.length || 0} departments`,
        details: departments
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'Departments Table',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 5: Categories
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, type, is_active, display_order')
      .order('display_order')

    if (error) {
      results.checks.push({
        name: 'Categories Table',
        status: 'fail',
        message: `Error: ${error.message}`,
        details: error
      })
    } else {
      results.checks.push({
        name: 'Categories Table',
        status: categories && categories.length > 0 ? 'pass' : 'warning',
        message: `Found ${categories?.length || 0} categories`,
        details: categories
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'Categories Table',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 6: RLS Policies
  try {
    // Try to read system_settings (tests SELECT policy)
    const { error: selectError } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1)

    if (selectError) {
      results.checks.push({
        name: 'RLS SELECT Policy',
        status: 'fail',
        message: `Cannot read settings: ${selectError.message}`
      })
    } else {
      results.checks.push({
        name: 'RLS SELECT Policy',
        status: 'pass',
        message: 'Can read settings'
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'RLS Policies',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 7: Helper Functions
  try {
    const { data, error } = await supabase.rpc('get_department_user_count', {
      department_name: 'IT Services'
    })

    if (error) {
      results.checks.push({
        name: 'Helper Functions',
        status: 'warning',
        message: `Function might not exist: ${error.message}`,
        details: error
      })
    } else {
      results.checks.push({
        name: 'Helper Functions',
        status: 'pass',
        message: 'get_department_user_count works',
        details: { user_count: data }
      })
    }
  } catch (error) {
    results.checks.push({
      name: 'Helper Functions',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return results
}

export default async function DiagnosticsPage() {
  const results = await runDiagnostics()

  return <DiagnosticsClient results={results} />
}
