import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { baseURL, login } from './helpers'

export default async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await login(page)

  const authDir = path.resolve(__dirname, '.auth')
  const authFile = path.resolve(authDir, 'user.json')
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir)
  }
  await page.context().storageState({ path: authFile })

  await browser.close()
}
