/**
 * PATCH /api/admin/users/[userId]/role
 *
 * Update a user's role. Only super_admin can call this.
 * Uses API route instead of Server Action to avoid production "apply" resolution
 * issues (Next.js Server Action reference undefined in Vercel).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { userRoleSchema } from '@/lib/validations/users'
import type { User } from '@/lib/types/users'

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await paramsPromise
    const userId = params.userId

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = userRoleSchema.safeParse(body?.newRole)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }
    const newRole = parsed.data

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return NextResponse.json({ success: true, data: data as User })
  } catch {
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
