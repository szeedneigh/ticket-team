# Playwright Testing Guide

This directory contains end-to-end tests for Ticket Team using [Playwright](https://playwright.dev/).

## Prerequisites

Before running tests, install the Playwright browsers:

```bash
npm run playwright:install
```

This will download Chromium (the default browser for testing). You only need to do this once.

## Running Tests

### Basic Commands

```bash
# Run all tests in headless mode
npm test

# Run tests with UI mode (recommended for development)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests with Playwright Inspector
npm run test:debug

# View test report
npm run test:report
```

### Advanced Options

```bash
# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "should display"

# Run in specific browser
npx playwright test --project=chromium

# Update snapshots
npx playwright test --update-snapshots
```

## Test Structure

```
tests/
├── e2e/              # End-to-end test files
│   ├── auth.spec.ts       # Authentication flow tests
│   └── landing.spec.ts    # Landing page tests
├── fixtures/         # Test fixtures and helpers
│   └── auth.ts            # Authentication fixtures
└── README.md         # This file
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should display page title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Ticket Team/)
})
```

### Using Authentication Fixture

```typescript
import { test, expect } from '../fixtures/auth'

test('should access dashboard when authenticated', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard')
  await expect(authenticatedPage).toHaveURL(/\/dashboard/)
})
```

## Configuration

The Playwright configuration is located in `playwright.config.ts` at the project root. Key settings:

- **Base URL**: `http://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- **Test timeout**: 30 seconds
- **Browser**: Chromium (default)
- **Web server**: Automatically starts dev server before tests

## Best Practices

### 1. Use Semantic Selectors

```typescript
// ✅ Good - semantic, resilient to changes
await page.getByRole('button', { name: /sign in/i })
await page.getByLabel('Email')

// ❌ Avoid - brittle, implementation-dependent
await page.click('.btn-primary')
await page.fill('#email-input')
```

### 2. Wait for Elements Properly

```typescript
// ✅ Good - automatic waiting
await expect(page.getByText('Success')).toBeVisible()

// ❌ Avoid - manual timeouts
await page.waitForTimeout(1000)
```

### 3. Test User Behavior, Not Implementation

```typescript
// ✅ Good - tests actual user flow
test('should submit ticket', async ({ page }) => {
  await page.goto('/tickets/new')
  await page.getByLabel('Title').fill('Bug report')
  await page.getByLabel('Description').fill('Details...')
  await page.getByRole('button', { name: /submit/i }).click()
  await expect(page.getByText('Ticket created')).toBeVisible()
})

// ❌ Avoid - tests implementation details
test('should call API endpoint', async ({ page }) => {
  // Testing API calls instead of user outcomes
})
```

### 4. Keep Tests Independent

Each test should be able to run independently and in any order:

```typescript
test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    // Set up fresh state for each test
    await page.goto('/tickets')
  })

  test('test 1', async ({ page }) => {
    // This should not depend on test 2
  })

  test('test 2', async ({ page }) => {
    // This should not depend on test 1
  })
})
```

## Authentication Testing

The `tests/fixtures/auth.ts` file provides an `authenticatedPage` fixture for testing protected routes. Currently, it's a placeholder that needs implementation.

### TODO: Implement Authentication Fixture

To properly test authenticated flows:

1. **Set up test user credentials** in environment variables or test config
2. **Create reusable authentication state** to avoid signing in for every test
3. **Store auth state** in `playwright/.auth/` directory
4. **Reuse auth state** across tests for performance

Example implementation:

```typescript
// tests/fixtures/auth.ts
import { test as base } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

// tests/auth.setup.ts (global setup)
async function globalSetup() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('/auth/sign-in')
  // Perform sign-in flow
  await page.fill('[name="email"]', 'test@laverdad.edu.ph')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')

  // Save signed-in state
  await context.storageState({ path: authFile })
  await browser.close()
}
```

## Test Coverage Goals

As you build out the test suite, aim to cover:

- [ ] Authentication flows (sign-in, sign-out, domain validation)
- [ ] Ticket creation and management
- [ ] User profile management
- [ ] Knowledge base search
- [ ] AI chat interactions
- [ ] Role-based access control
- [ ] Responsive design (mobile/desktop)
- [ ] Error handling and edge cases

## Debugging Failed Tests

### View trace for failed tests

Traces are automatically captured on first retry:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Use Playwright Inspector

```bash
npm run test:debug
```

This opens the Playwright Inspector where you can step through tests line by line.

### Check screenshots and videos

Failed tests automatically capture screenshots and videos in `test-results/`.

## CI/CD Integration

The Playwright configuration is already CI-ready:

- Retries failed tests 2 times on CI
- Runs tests serially on CI (`workers: 1`)
- Fails build if `test.only` is left in code
- Produces HTML and list reports

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run Playwright tests
  run: npm test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selector Guide](https://playwright.dev/docs/selectors)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

## Next Steps

1. **Install browsers**: `npm run playwright:install`
2. **Implement authentication fixture** in `tests/fixtures/auth.ts`
3. **Add more test cases** based on coverage goals above
4. **Run tests locally**: `npm run test:ui`
5. **Set up CI/CD** integration for automated testing
