import { test, expect } from '@playwright/test'
import { expectHeading } from './helpers'

test.describe('Recipients & Outreach', () => {
  test('recipients list page loads', async ({ page }) => {
    await page.goto('/recipients')
    await expectHeading(page, /recipients/i)
  })

  test('recipient groups page loads', async ({ page }) => {
    await page.goto('/recipient-groups')
    await expectHeading(page, /recipient groups/i)
  })
})
