/**
 * Vitest Setup File
 *
 * Global test configuration and setup
 */

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock server-only environment variables to prevent security errors in tests
// This must be done before any imports that use @/lib/env/server
vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    supabaseService: {
      roleKey: 'test-service-role-key',
    },
    gemini: {
      apiKey: 'test-gemini-api-key',
    },
  },
}))

// Mock client environment variables
vi.mock('@/lib/env/client', () => ({
  clientEnv: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
    },
    app: {
      siteUrl: 'http://localhost:3000',
    },
  },
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
// NODE_ENV is automatically set to 'test' by Vitest
