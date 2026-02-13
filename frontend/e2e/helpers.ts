import { expect, Page } from '@playwright/test'

export const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export const getEnvOrThrow = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const login = async (page: Page) => {
  const username = getEnvOrThrow('E2E_USER')
  const password = getEnvOrThrow('E2E_PASS')

  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByPlaceholder('Enter your username').fill(username, { timeout: 15000 })
  await page.getByPlaceholder('Enter your password').fill(password, { timeout: 15000 })
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 30000 })
}

export const expectHeading = async (page: Page, text: RegExp | string) => {
  await expect(page.getByRole('heading', { name: text })).toBeVisible()
}

export const maybeClick = async (page: Page, selector: string) => {
  const target = page.locator(selector)
  if (await target.isVisible()) {
    await target.click()
  }
}
