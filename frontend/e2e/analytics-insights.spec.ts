import { test } from '@playwright/test'
import { expectHeading } from './helpers'

test.describe('Analytics & Insights', () => {
  test('analytics page loads', async ({ page }) => {
    await page.goto('/analytics')
    await expectHeading(page, /analytics/i)
  })

  test('insights page loads', async ({ page }) => {
    await page.goto('/insights')
    await expectHeading(page, /insights/i)
  })
})
