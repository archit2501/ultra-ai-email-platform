import { test } from '@playwright/test'
import { expectHeading, login } from './helpers'

test.describe('Applications / Pipeline', () => {
  test.skip('applications list page loads', async ({ page }) => {
    await page.goto('/applications')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/applications')
      await page.waitForLoadState('networkidle')
    }
    await expectHeading(page, /applications|pipeline/i)
  })
})
