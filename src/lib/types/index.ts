/**
 * Types Barrel Export
 * 
 * Central export point for all application types
 */

// Database core types
export * from './database'

// Domain types
export * from './users'
export * from './tickets'
export * from './knowledge-base'
export * from './ai'

// API types
export * from './api'

// Re-export commonly used Supabase types
export type { User as SupabaseUser } from '@supabase/supabase-js'

