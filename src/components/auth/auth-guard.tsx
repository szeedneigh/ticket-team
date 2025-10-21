/**
 * Authentication Guard Component
 * 
 * Client-side component that protects routes and components.
 * Redirects to sign-in if not authenticated or shows fallback during loading.
 * 
 * @module components/auth/auth-guard
 */

'use client'

import { useUser } from '@/lib/hooks/use-user'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserRole } from '@/lib/types/database'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * Guard component that requires authentication
 * 
 * @example
 * ```tsx
 * <AuthGuard requiredRole="admin">
 *   <AdminPanel />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ 
  children, 
  requiredRole, 
  fallback,
  redirectTo = '/auth/sign-in'
}: AuthGuardProps) {
  const { user, loading, hasRole } = useUser()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])
  
  useEffect(() => {
    if (!loading && user && requiredRole && !hasRole(requiredRole)) {
      router.push('/dashboard?error=insufficient_permissions')
    }
  }, [user, loading, requiredRole, hasRole, router])
  
  if (loading) {
    return <>{fallback || <LoadingSkeleton />}</>
  }
  
  if (!user) {
    return null
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    return null
  }
  
  return <>{children}</>
}

/**
 * Default loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-8">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

