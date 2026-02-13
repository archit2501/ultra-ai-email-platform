import { test, expect } from '@playwright/test'
import { login, expectHeading } from './helpers'

test.describe('Authentication & Dashboard', () => {
  test.describe('Login & Session', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.skip('login and session persistence', async ({ page }) => {
      await login(page)
      await expectHeading(page, /dashboard/i)

      await page.reload()
      await expectHeading(page, /dashboard/i)
    })
  })

  test.skip('sidebar navigation items visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    }

    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /campaigns/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /recipients/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /templates/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /applications/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /documents/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /inbox/i })).toBeVisible()
  })

  test.skip('responsive layout loads on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    }
    await expectHeading(page, /dashboard/i)
  })
})
