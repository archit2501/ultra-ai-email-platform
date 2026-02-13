import { test, expect } from '@playwright/test'
import { expectHeading, login } from './helpers'

test.describe('Templates & Resources', () => {
  test.skip('templates library page loads', async ({ page }) => {
    await page.goto('/templates')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/templates')
      await page.waitForLoadState('networkidle')
    }
    await expectHeading(page, /templates/i)
    await expect(page.getByRole('button', { name: /create new template/i })).toBeVisible()
  })

  test.skip('documents page loads', async ({ page }) => {
    await page.goto('/documents')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/documents')
      await page.waitForLoadState('networkidle')
    }
    await expectHeading(page, /documents/i)
  })
})
