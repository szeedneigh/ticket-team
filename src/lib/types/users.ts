/**
 * User Domain Types
 * 
 * Type definitions for user profiles, authentication, and RBAC
 */

import type { UserRole } from './database'

// ============================================================================
// User Profile Types
// ============================================================================

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  department: string | null
  position: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_login: string | null
  deactivated_at: string | null
  deactivated_by: string | null
}

export interface UserProfile extends Omit<User, 'id'> {
  id: string
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  full_name: string
  avatar_url: string | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
  department?: string
  position?: string
  phone?: string
}

// ============================================================================
// User Management Types
// ============================================================================

export interface CreateUserData {
  email: string
  full_name: string
  role?: UserRole
  department?: string
  position?: string
  phone?: string
  password: string
}

export interface UpdateUserData {
  full_name?: string
  department?: string
  position?: string
  phone?: string
  avatar_url?: string
}

export interface DeactivateUserData {
  user_id: string
  reason?: string
}

// ============================================================================
// User List/Filter Types
// ============================================================================

export interface UserFilters {
  role?: UserRole
  department?: string
  is_active?: boolean
  search?: string
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  per_page: number
}

