import { test, expect } from '@playwright/test'
import { expectHeading } from './helpers'

test.describe('Marketplace & Extraction Tools', () => {
  test('marketplace page loads', async ({ page }) => {
    await page.goto('/marketplace')
    await expectHeading(page, /marketplace/i)
  })

  test('extraction pages load', async ({ page }) => {
    await page.goto('/extraction')
    await expectHeading(page, /extraction/i)

    await page.goto('/mobiadz-extraction')
    await expectHeading(page, /mobiadz/i)
  })
})
