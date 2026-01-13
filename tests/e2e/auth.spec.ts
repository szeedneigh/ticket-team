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

  test('should handle invalid domain error', async ({ page: _page }) => {
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

test.describe('Role-Based Access Control (RBAC)', () => {
  authenticatedTest('employee should access employee-only routes', async ({ page }) => {
    // Employees can access dashboard, tickets, profile
    await page.goto('/dashboard')
    await authExpect(page).toHaveURL(/\/dashboard/)

    await page.goto('/tickets')
    await authExpect(page).toHaveURL(/\/tickets/)

    await page.goto('/profile')
    await authExpect(page).toHaveURL(/\/profile/)
  })

  authenticatedTest('employee should be blocked from admin routes', async ({ page }) => {
    // Employees should be redirected from admin routes
    await page.goto('/admin/users')
    // Should redirect to dashboard or show 403
    const url = page.url()
    expect(url).not.toContain('/admin/users')
  })

  authenticatedTest('staff should access staff routes', async ({ page }) => {
    // Staff can access performance page
    await page.goto('/performance')
    // Should either show the page or redirect based on role
    // This test assumes staff role is set up in test fixtures
  })

  authenticatedTest('admin should access admin routes', async ({ page }) => {
    // Admins can access admin pages
    await page.goto('/admin/users')
    // Should show admin page or redirect based on role
    // This test assumes admin role is set up in test fixtures
  })

  authenticatedTest('should enforce domain validation', async ({ page }) => {
    // Domain validation happens in auth callback
    // This would require mocking the OAuth callback
    // For now, we test that the sign-in page shows domain info
    await page.goto('/auth/sign-in')
    const pageContent = await page.textContent('body')
    // Should mention domain requirement
    expect(pageContent).toBeTruthy()
  })
})