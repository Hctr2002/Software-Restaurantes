import { test, expect } from '@playwright/test'

/**
 * E2E tests for customer-portal (http://localhost:3005).
 * This app is public-facing — no authentication required.
 * These tests assume the dev server is running: npm run dev
 */

test.describe('Customer Portal — menú público', () => {
  test('muestra el menú del restaurante', async ({ page }) => {
    await page.goto('/')
    // The portal renders a menu — verify at least the page loads
    await expect(page).toHaveTitle(/Menu Bites|menú|carta/i)
  })

  test('navega a la página de pedido', async ({ page }) => {
    await page.goto('/')
    // Look for a call-to-action or menu item
    const menuSection = page.locator('[data-testid="menu-section"], main, #menu')
    await expect(menuSection.first()).toBeVisible({ timeout: 10_000 })
  })

  test('página responde con HTTP 200', async ({ request }) => {
    const response = await request.get('/')
    expect(response.status()).toBe(200)
  })
})

test.describe('Customer Portal — flujo de pedido', () => {
  test('puede ver los items del menú', async ({ page }) => {
    await page.goto('/')
    // Menu items should be visible
    const items = page.locator('[data-testid="menu-item"], .menu-item, article')
    await expect(items.first()).toBeVisible({ timeout: 15_000 })
  })
})
