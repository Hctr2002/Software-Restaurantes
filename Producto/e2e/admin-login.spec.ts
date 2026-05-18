import { test, expect } from '@playwright/test'

/**
 * E2E tests for admin-dashboard login flow (http://localhost:3000).
 * These tests assume the dev server is running: npm run dev
 */

const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:3000'

test.describe('Admin Dashboard — login', () => {
  test('muestra el formulario de login', async ({ page }) => {
    await page.goto(ADMIN_URL)
    // Should show email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto(ADMIN_URL)
    await page.locator('input[type="email"], input[name="email"]').fill('invalid@test.com')
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Login")').click()
    // Should show error message
    const error = page.locator('[role="alert"], .error, [data-testid="error"]')
    await expect(error).toBeVisible({ timeout: 5_000 })
  })

  test('redirige a la app correcta tras login exitoso', async ({ page }) => {
    // Skip if no test credentials are configured
    const testEmail = process.env.E2E_TEST_EMAIL
    const testPassword = process.env.E2E_TEST_PASSWORD
    if (!testEmail || !testPassword) {
      test.skip()
      return
    }

    await page.goto(ADMIN_URL)
    await page.locator('input[type="email"], input[name="email"]').fill(testEmail)
    await page.locator('input[type="password"], input[name="password"]').fill(testPassword)
    await page.locator('button[type="submit"]').click()
    // After login, should redirect away from the login page
    await expect(page).not.toHaveURL(ADMIN_URL + '/login', { timeout: 10_000 })
  })
})
