import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration.
 * Run: npx playwright test
 * Report: npx playwright show-report
 *
 * Apps must be running locally before running E2E tests.
 * Start with: npm run dev
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3005',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Reuse running dev servers — don't start/stop them automatically.
  // See README-testing.md for local setup instructions.
})
