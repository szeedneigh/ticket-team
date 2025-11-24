import { test, expect } from '@playwright/test'

/**
 * Landing page tests
 *
 * These tests verify the public landing page functionality
 * for unauthenticated users.
 */

// Override storage state for unauthenticated tests
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the landing page', async ({ page }) => {
    // Verify the page loads
    await expect(page).toHaveURL('/')

    // Check for common landing page elements
    // Note: Update these selectors based on your actual landing page
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('should have sign-in link', async ({ page }) => {
    // Look for sign-in/login link
    const signInLink = page.getByRole('link', { name: /sign in|login/i })
    await expect(signInLink).toBeVisible()
  })

  test('should navigate to sign-in page', async ({ page }) => {
    // Click sign-in and verify navigation
    const signInLink = page.getByRole('link', { name: /sign in|login/i })
    await signInLink.click()

    await expect(page).toHaveURL(/\/auth\/sign-in/)
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(heading).toBeVisible()
  })
})
