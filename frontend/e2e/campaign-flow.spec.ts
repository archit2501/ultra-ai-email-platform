import { test, expect } from '@playwright/test'
import path from 'path'
import { expectHeading, login } from './helpers'

test.describe('Campaign Creation Flow', () => {
  test.skip('Step 1: CSV upload and summary', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-drafts')
    })
    await page.goto('/campaigns/create/step1-source')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.addInitScript(() => {
        localStorage.removeItem('campaign-drafts')
      })
      await page.goto('/campaigns/create/step1-source')
      await page.waitForLoadState('networkidle')
    }

    const goalHeading = page.getByRole('heading', { name: /What's your goal\?/i })
    if (await goalHeading.isVisible()) {
      await page.getByRole('button', { name: /Looking for Jobs/i }).click()
    }
    await page.getByRole('button', { name: /upload csv/i }).click()

    const csvPath = path.resolve(__dirname, '..', '..', 'recruiters - luxemberg.csv')
    await page.setInputFiles('input[type="file"]', csvPath)

    await page.getByRole('button', { name: /continue to preview/i }).click()
    await page.getByRole('button', { name: /import .* recipients/i }).click()

    await page.getByRole('heading', { name: /review your data source/i }).isVisible()

    const modalContinue = page.getByRole('button', { name: /continue with .* recipients/i })
    if (await modalContinue.isVisible()) {
      await modalContinue.click()
    }

    await page.getByRole('button', { name: /next: enrich/i }).click()
    await page.waitForURL('**/campaigns/create/step2-enrich')
  })

  test.skip('Step 1: Manual entry validation', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-drafts')
    })
    await page.goto('/campaigns/create/step1-source')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.addInitScript(() => {
        localStorage.removeItem('campaign-drafts')
      })
      await page.goto('/campaigns/create/step1-source')
      await page.waitForLoadState('networkidle')
    }

    const goalHeading = page.getByRole('heading', { name: /What's your goal\?/i })
    if (await goalHeading.isVisible()) {
      await page.getByRole('button', { name: /Looking for Jobs/i }).click()
    }
    await page.getByRole('button', { name: /manual entry/i }).click()

    await page.getByPlaceholder('name@example.com').fill('invalid-email')
    await page.getByRole('button', { name: /add recipient/i }).click()
    await expect(page.getByText(/invalid email format/i)).toBeVisible()
  })

  test.skip('Step 2: Enrichment settings UI', async ({ page }) => {
    await page.goto('/campaigns/create/step2-enrich')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/campaigns/create/step2-enrich')
      await page.waitForLoadState('networkidle')
    }

    await expect(page.getByText(/email validation/i)).toBeVisible()
    await expect(page.getByText(/fraud detection/i)).toBeVisible()
    await expect(page.getByText(/duplicate removal/i)).toBeVisible()

    await page.getByRole('button', { name: /continue to templates/i }).click()
    await page.waitForURL('**/campaigns/create/step3-template')
  })

  test.skip('Step 3: Template selection and continue', async ({ page }) => {
    await page.goto('/campaigns/create/step3-template')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/campaigns/create/step3-template')
      await page.waitForLoadState('networkidle')
    }

    await page.getByRole('button', { name: /template marketplace/i }).click()
    await page.getByText(/template 1:/i).first().click()
    await page.getByRole('button', { name: /use this template/i }).first().click()

    await page.getByRole('button', { name: /continue to send options/i }).click()
    await page.waitForURL('**/campaigns/create/step4-send')
  })

  test.skip('Step 4: Send options UI', async ({ page }) => {
    await page.goto('/campaigns/create/step4-send')
    await page.waitForLoadState('networkidle')

    const loginField = page.getByPlaceholder('Enter your username')
    if (await loginField.isVisible().catch(() => false)) {
      await login(page)
      await page.goto('/campaigns/create/step4-send')
      await page.waitForLoadState('networkidle')
    }

    await page.getByText(/immediate send/i).click()
    await expect(page.getByRole('button', { name: /launch campaign/i })).toBeVisible()
  })
})
