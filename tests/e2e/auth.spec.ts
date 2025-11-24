import { test, expect } from '@playwright/test'
import { authenticatedTest, expect as authExpect } from '../fixtures/auth'

/**
 * Authentication flow tests
 *
 * Tests the complete authentication flow including:
 * - Sign-in page rendering
 * - Google OAuth integration
 * - Domain validation (@laverdad.edu.ph)
 * - Session management
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in')
  })

  test('should display sign-in page', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/sign-in/)

    // Verify sign-in UI elements
    const heading = page.getByRole('heading', { name: /sign in/i })
    await expect(heading).toBeVisible()
  })

  test('should show Google sign-in button', async ({ page }) => {
    // Look for Google OAuth button
    const googleButton = page.getByRole('button', { name: /google/i })
    await expect(googleButton).toBeVisible()
  })

  authenticatedTest('should redirect authenticated users away from sign-in', async ({ page }) => {
    // Navigate to sign-in page while authenticated
    await page.goto('/auth/sign-in')

    // Should redirect to dashboard
    await authExpect(page).toHaveURL(/\/dashboard/)
  })

  test('should handle invalid domain error', async ({ page }) => {
    // Note: This requires mocking Supabase auth callback
    // 1. Mock OAuth callback with non-LVCC email
    // 2. Verify error message is shown
    // 3. Confirm user is redirected to error page
  })

  authenticatedTest('should maintain session after page reload', async ({ page }) => {
    // Navigate to dashboard (requires auth)
    await page.goto('/dashboard')
    await authExpect(page).toHaveURL(/\/dashboard/)

    // Reload the page
    await page.reload()

    // Should still be on dashboard (session maintained)
    await authExpect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/)
  })

  test('should redirect unauthenticated users from profile', async ({ page }) => {
    await page.goto('/profile')

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/)
  })
})
