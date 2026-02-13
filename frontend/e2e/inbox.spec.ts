import { test } from '@playwright/test'
import { expectHeading } from './helpers'

test.describe('Email Inbox & Threading', () => {
  test('inbox page loads', async ({ page }) => {
    await page.goto('/inbox')
    await expectHeading(page, /inbox/i)
  })
})
