/**
 * Authentication fixture for Playwright tests
 *
 * This fixture extends the base test to provide authenticated user contexts.
 * It uses the storage state saved by global-setup.ts to authenticate users.
 *
 * @example
 * // Import from this file instead of @playwright/test
 * import { test, expect } from '../fixtures/auth'
 *
 * test('should access dashboard', async ({ page }) => {
 *   await page.goto('/dashboard')
 *   await expect(page).toHaveTitle(/Dashboard/)
 * })
 */

import { test as base, type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Path to saved authentication state
const STORAGE_STATE = path.join(__dirname, '../.auth/user.json')

type AuthFixtures = {
  authenticatedPage: Page
}

/**
 * Check if storage state file exists
 */
function hasStorageState(): boolean {
  try {
    return fs.existsSync(STORAGE_STATE)
  } catch {
    return false
  }
}

export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated page fixture
   *
   * Provides a page with pre-loaded authentication state.
   * Falls back to unauthenticated page if storage state is not available.
   */
  authenticatedPage: async ({ browser }, use) => {
    if (hasStorageState()) {
      // Create context with saved authentication state
      const context = await browser.newContext({
        storageState: STORAGE_STATE
      })
      const page = await context.newPage()
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(page)
      await context.close()
    } else {
      console.warn('⚠️ No auth storage state found. Run global setup first.')
      console.warn('⚠️ Test will run without authentication.')
      // Fall back to unauthenticated page
      const context = await browser.newContext()
      const page = await context.newPage()
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(page)
      await context.close()
    }
  },
})

/**
 * Test with pre-configured authentication
 *
 * Use this for tests that require authentication.
 * The page will automatically have auth cookies/localStorage set
 * from the storage state saved by global-setup.ts.
 *
 * @example
 * import { authenticatedTest, expect } from '../fixtures/auth'
 *
 * authenticatedTest('should show user profile', async ({ page }) => {
 *   await page.goto('/profile')
 *   await expect(page.getByText('Test User')).toBeVisible()
 * })
 */
export const authenticatedTest = base.extend({
  storageState: hasStorageState() ? STORAGE_STATE : undefined,
})

export { expect } from '@playwright/test'
