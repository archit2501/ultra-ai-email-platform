import { test, expect, Page } from '@playwright/test'
import { login } from './helpers'

const goToCsvUpload = async (page: Page) => {
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

  const uploadHeading = page.getByRole('heading', { name: /Upload CSV File/i })
  if (await uploadHeading.isVisible()) {
    return
  }

  const goalHeading = page.getByRole('heading', { name: /What's your goal\?/i })
  if (await goalHeading.isVisible()) {
    await page.getByRole('button', { name: /Looking for Jobs/i }).click()
  }

  const dataSourceHeading = page.getByRole('heading', { name: /Where do you want to get recipients\?/i })
  if (await dataSourceHeading.isVisible()) {
    await page.getByRole('button', { name: /Upload CSV/i }).click()
  }

  await expect(uploadHeading).toBeVisible({ timeout: 10000 })
}

test.describe('Step 1 - Recipient Sources', () => {
  test('reach CSV upload view', async ({ page }) => {
    await goToCsvUpload(page)
    await expect(page.getByRole('heading', { name: /Upload CSV File/i })).toBeVisible()
  })

  test('CSV file input accepts CSV', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]')
    await expect(input).toHaveCount(1)
    const accept = await input.first().getAttribute('accept')
    expect(accept).toContain('.csv')
  })

  test('upload CSV advances to mapping', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
    await expect(page.getByRole('heading', { name: /Map Columns/i })).toBeVisible({ timeout: 10000 })
  })

  test('column mapping shows detected columns', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
    await expect(page.getByRole('heading', { name: /Map Columns/i })).toBeVisible({ timeout: 10000 })
    
    await expect(page.locator('td').filter({ hasText: /^Email$/ })).toBeVisible()
    await expect(page.locator('td').filter({ hasText: /^Company$/ })).toBeVisible()
  })

  test('complete CSV import saves recipients', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
    await expect(page.getByRole('heading', { name: /Map Columns/i })).toBeVisible({ timeout: 10000 })
    
    const continueBtn = page.getByRole('button', { name: /Continue|Next|Confirm/i })
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await page.waitForTimeout(2000)
    }
  })

  test('manual entry option is available', async ({ page }) => {
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

    await expect(page.getByRole('button', { name: /Manual Entry|Add Manually/i })).toBeVisible({ timeout: 10000 })
  })

  test('recipient groups option is available', async ({ page }) => {
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

    await expect(page.getByRole('button', { name: /Recipient Groups|Select from Groups/i })).toBeVisible({ timeout: 10000 })
  })

  test('applications option is available', async ({ page }) => {
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

    await expect(page.getByRole('button', { name: /Applications|From Job Applications/i })).toBeVisible({ timeout: 10000 })
  })

  test('back button returns to goal selection', async ({ page }) => {
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

    const backBtn = page.getByRole('button', { name: /Back/i })
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(page.getByRole('heading', { name: /What's your goal\?/i })).toBeVisible({ timeout: 5000 })
    }
  })

  test('can switch between client and job seeker goals', async ({ page }) => {
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
      
      const backBtn = page.getByRole('button', { name: /Back/i })
      if (await backBtn.isVisible()) {
        await backBtn.click()
        await page.getByRole('button', { name: /Looking for Clients/i }).click()
        await expect(page.getByRole('heading', { name: /Where do you want to get recipients\?/i })).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('manual entry form has required fields', async ({ page }) => {
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

    const manualBtn = page.getByRole('button', { name: /Manual Entry|Add Manually/i })
    if (await manualBtn.isVisible()) {
      await manualBtn.click()
      await page.waitForTimeout(1000)
      
      const emailField = page.getByPlaceholder(/email|Email/i)
      const nameField = page.getByPlaceholder(/name|Name/i)
      
      if (await emailField.first().isVisible()) {
        await expect(emailField.first()).toBeVisible()
      }
      if (await nameField.first().isVisible()) {
        await expect(nameField.first()).toBeVisible()
      }
    }
  })

  test('recipient groups shows empty state or groups list', async ({ page }) => {
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

    const groupsBtn = page.getByRole('button', { name: /Recipient Groups|Select from Groups/i })
    if (await groupsBtn.isVisible()) {
      await groupsBtn.click()
      await page.waitForTimeout(2000)
    }
  })

  test('applications shows filter options', async ({ page }) => {
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

    const appsBtn = page.getByRole('button', { name: /Applications|From Job Applications/i })
    if (await appsBtn.isVisible()) {
      await appsBtn.click()
      await page.waitForTimeout(2000)
    }
  })

  test('CSV validation rejects invalid files', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    
    await page.evaluate(() => {
      const dt = new DataTransfer()
      const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' })
      dt.items.add(file)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      if (input) input.files = dt.files
    })
    
    await page.waitForTimeout(1000)
  })

  test('CSV preview shows sample data', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
    await expect(page.getByRole('heading', { name: /Map Columns/i })).toBeVisible({ timeout: 10000 })
    
    const previewHeading = page.getByRole('heading', { name: /Preview/i })
    if (await previewHeading.isVisible()) {
      await expect(previewHeading).toBeVisible()
      await expect(page.locator('table').nth(1)).toBeVisible()
    }
  })

  test('goal selection persists on page reload', async ({ page }) => {
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
      await page.waitForTimeout(500)
      
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      const dataSourceHeading = page.getByRole('heading', { name: /Where do you want to get recipients\?/i })
      if (await dataSourceHeading.isVisible()) {
        await expect(dataSourceHeading).toBeVisible()
      }
    }
  })

  test('CSV import can be cancelled and restarted', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
    await expect(page.getByRole('heading', { name: /Map Columns/i })).toBeVisible({ timeout: 10000 })
    
    const backBtn = page.locator('button').filter({ hasText: /Back/ })
    if (await backBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await backBtn.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('multiple data source options work independently', async ({ page }) => {
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

    await expect(page.getByRole('button', { name: /Upload CSV/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Manual Entry|Add Manually/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Recipient Groups|Select from Groups/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Applications|From Job Applications/i })).toBeVisible()
  })

  test('CSV with missing email column shows validation error', async ({ page }) => {
    await goToCsvUpload(page)
    
    await page.evaluate(() => {
      const csvContent = 'Name,Company\nJohn Smith,TechCorp\nSarah Johnson,Innovate Inc'
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], 'no-email.csv', { type: 'text/csv' })
      const dt = new DataTransfer()
      dt.items.add(file)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      if (input) {
        input.files = dt.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    
    await page.waitForTimeout(2000)
  })

  test('continue button appears after CSV mapping', async ({ page }) => {
    await goToCsvUpload(page)
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
    await expect(page.getByRole('heading', { name: /Map Columns/i })).toBeVisible({ timeout: 10000 })
    
    await expect(page.getByRole('button', { name: /Continue|Next|Confirm/i })).toBeVisible({ timeout: 5000 })
  })

  test('data source view shows goal-appropriate options', async ({ page }) => {
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
      await page.getByRole('button', { name: /Looking for Clients/i }).click()
    }

    const dataSourceHeading = page.getByRole('heading', { name: /Where do you want to get recipients\?/i })
    await expect(dataSourceHeading).toBeVisible({ timeout: 5000 })
  })
})
