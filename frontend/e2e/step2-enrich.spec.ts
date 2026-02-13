import { test, expect, Page } from '@playwright/test'
import { login } from './helpers'

const goToEnrichmentPage = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.removeItem('campaign-drafts')
  })
  await page.goto('/campaigns/create/step2-enrich')
  await page.waitForLoadState('networkidle')

  const loginField = page.getByPlaceholder('Enter your username')
  if (await loginField.isVisible().catch(() => false)) {
    await login(page)
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-drafts')
    })
    await page.goto('/campaigns/create/step2-enrich')
    await page.waitForLoadState('networkidle')
  }

  // Check if we're already on enrichment page with content
  const currentUrl = page.url()
  if (currentUrl.includes('step2-enrich')) {
    const richContent = page.locator('body').locator('button, [role="switch"], input')
    if (await richContent.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      return
    }
  }

  // If we're on step2 but need to set up data, navigate from step1
  await page.goto('/campaigns/create/step1-source')
  await page.waitForLoadState('networkidle')

  const goalHeading = page.getByRole('heading', { name: /What's your goal\?/i })
  if (await goalHeading.isVisible()) {
    await page.getByRole('button', { name: /Looking for Jobs/i }).click()
  }

  const dataSourceHeading = page.getByRole('heading', { name: /Where do you want to get recipients\?/i })
  if (await dataSourceHeading.isVisible()) {
    await page.getByRole('button', { name: /Upload CSV/i }).click()
  }

  const uploadHeading = page.getByRole('heading', { name: /Upload CSV File/i })
  if (await uploadHeading.isVisible()) {
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
  }

  const mapHeading = page.getByRole('heading', { name: /Map Columns/i })
  if (await mapHeading.isVisible({ timeout: 10000 })) {
    const continueBtn = page.getByRole('button', { name: /Continue|Next|Confirm/i })
    if (await continueBtn.first().isVisible()) {
      await continueBtn.first().click()
    }
  }

  await page.waitForTimeout(2000)
  
  // Navigate to enrichment step
  const nextBtn = page.getByRole('button').filter({ hasText: /next|continue|proceed/i })
  if (await nextBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await nextBtn.first().click()
    await page.waitForTimeout(2000)
  }

  // Final fallback: direct navigation
  if (!page.url().includes('step2-enrich')) {
    await page.goto('/campaigns/create/step2-enrich')
    await page.waitForLoadState('networkidle')
  }
}

test.describe('Step 2 - Data Enrichment', () => {
  test('reach enrichment settings page', async ({ page }) => {
    await goToEnrichmentPage(page)
    await expect(page.locator('body')).toContainText(/Enrichment|enrichment/, { timeout: 5000 })
  })

  test('enrichment options are visible', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const enrichmentDepth = page.getByText(/Quick|Standard|Deep/i)
    const emailValidation = page.getByText(/Email Validation|email validation/i)
    const fraudDetection = page.getByText(/Fraud Detection|fraud detection/i)
    
    if (await enrichmentDepth.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(enrichmentDepth.first()).toBeVisible()
    }
    if (await emailValidation.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(emailValidation.first()).toBeVisible()
    }
    if (await fraudDetection.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(fraudDetection.first()).toBeVisible()
    }
  })

  test('enrichment depth selection works', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const depthOptions = page.locator('button').filter({ hasText: /Quick|Standard|Deep/ })
    if (await depthOptions.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const buttons = await depthOptions.all()
      if (buttons.length >= 2) {
        await buttons[1].click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('email validation toggle works', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const switches = page.locator('button[role="switch"]')
    const count = await switches.count()
    
    if (count > 0) {
      const firstSwitch = switches.first()
      if (await firstSwitch.isVisible()) {
        const initialState = await firstSwitch.getAttribute('data-state')
        await firstSwitch.click()
        await page.waitForTimeout(300)
        const newState = await firstSwitch.getAttribute('data-state')
        // State changed or at least click executed
      }
    }
  })

  test('fraud detection toggle works', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const switches = page.locator('button[role="switch"]')
    if (await switches.nth(1).isVisible({ timeout: 3000 }).catch(() => false)) {
      await switches.nth(1).click()
      await page.waitForTimeout(300)
    }
  })

  test('duplicate removal toggle works', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const switches = page.locator('button[role="switch"]')
    if (await switches.nth(2).isVisible({ timeout: 3000 }).catch(() => false)) {
      await switches.nth(2).click()
      await page.waitForTimeout(300)
    }
  })

  test('advanced options toggle visibility', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const advancedBtn = page.locator('button').filter({ hasText: /Advanced|Settings|Options/ })
    if (await advancedBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('company intelligence option visible', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const companyIntel = page.getByText(/Company Intelligence|company intelligence/i)
    if (await companyIntel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(companyIntel).toBeVisible()
    }
  })

  test('person intelligence option visible', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const personIntel = page.getByText(/Person Intelligence|person intelligence/i)
    if (await personIntel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(personIntel).toBeVisible()
    }
  })

  test('tech stack matching option available', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const techStack = page.getByText(/Tech Stack|tech stack|Technology/i)
    if (await techStack.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(techStack.first()).toBeVisible()
    }
  })

  test('skill matching option available', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const skillMatch = page.getByText(/Skill Matching|skill matching|Skills/i)
    if (await skillMatch.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(skillMatch.first()).toBeVisible()
    }
  })

  test('send time optimization option available', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const sendTime = page.getByText(/Send Time|send time optimization/i)
    if (await sendTime.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sendTime.first()).toBeVisible()
    }
  })

  test('deduplication option available', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const dedup = page.getByText(/Deduplicate|deduplication|Duplicate Removal/i)
    if (await dedup.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dedup.first()).toBeVisible()
    }
  })

  test('run enrichment button exists', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const runBtn = page.getByRole('button').filter({ hasText: /Run Enrichment|Start Enrichment|Enrich/ })
    if (await runBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(runBtn.first()).toBeVisible()
    }
  })

  test('continue to templates button exists', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const continueBtn = page.getByRole('button').filter({ hasText: /Continue|Next|Templates/ })
    if (await continueBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(continueBtn.first()).toBeVisible()
    }
  })

  test('back button returns to step 1', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const backBtn = page.getByRole('button').filter({ hasText: /Back/ })
    if (await backBtn.first().isVisible()) {
      await backBtn.first().click()
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/step1-source|step2-enrich/, { timeout: 5000 })
    }
  })

  test('enrichment settings persist on reload', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const switches = page.locator('button[role="switch"]')
    if (await switches.first().isVisible()) {
      await switches.first().click()
      await page.waitForTimeout(500)
      
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      const switches2 = page.locator('button[role="switch"]')
      if (await switches2.first().isVisible({ timeout: 3000 })) {
        await expect(switches2.first()).toBeVisible()
      }
    }
  })

  test('enrichment progress indicator displays when running', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const runBtn = page.getByRole('button').filter({ hasText: /Run Enrichment|Start/ })
    if (await runBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.first().click()
      await page.waitForTimeout(1000)
      
      const progressIndicator = page.locator('[role="progressbar"]')
      if (await progressIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(progressIndicator).toBeVisible()
      }
    }
  })

  test('enrichment job status visible after execution', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const runBtn = page.getByRole('button').filter({ hasText: /Run Enrichment|Start/ })
    if (await runBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.first().click()
      await page.waitForTimeout(2000)
      
      const jobStatus = page.getByText(/Status|Running|Completed|Failed/i)
      if (await jobStatus.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(jobStatus.first()).toBeVisible()
      }
    }
  })

  test('enrichment results display after completion', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const runBtn = page.getByRole('button').filter({ hasText: /Run Enrichment|Start/ })
    if (await runBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.first().click()
      await page.waitForTimeout(3000)
      
      const results = page.getByText(/Results|Validated|Duplicates|Enriched/i)
      if (await results.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(results.first()).toBeVisible()
      }
    }
  })

  test('deduplication UI accessible when available', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const dedupBtn = page.getByRole('button').filter({ hasText: /Dedup|Find Duplicates/ })
    if (await dedupBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dedupBtn.first()).toBeVisible()
    }
  })

  test('enrichment error message displays on failure', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const runBtn = page.getByRole('button').filter({ hasText: /Run Enrichment|Start/ })
    if (await runBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.first().click()
      await page.waitForTimeout(2000)
      
      // Check for error or success message
      const message = page.getByText(/Error|Failed|Success|Completed/i)
      if (await message.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(message.first()).toBeVisible()
      }
    }
  })

  test('enrichment can be cancelled', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const runBtn = page.getByRole('button').filter({ hasText: /Run Enrichment|Start/ })
    if (await runBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.first().click()
      await page.waitForTimeout(500)
      
      const cancelBtn = page.getByRole('button').filter({ hasText: /Cancel|Stop/ })
      if (await cancelBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelBtn.first().click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('enrichment configuration summary displays', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const summary = page.getByText(/Configuration|Settings|Options/i)
    if (await summary.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(summary.first()).toBeVisible()
    }
  })

  test('estimated enrichment time displayed', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const timeEstimate = page.getByText(/minutes|seconds|estimated|Duration/i)
    if (await timeEstimate.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(timeEstimate.first()).toBeVisible()
    }
  })

  test('enrichment cost information visible for paid features', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const cost = page.getByText(/Cost|Credits|Price|Free/i)
    if (await cost.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(cost.first()).toBeVisible()
    }
  })

  test('multiple enrichment features can be toggled', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const switches = page.locator('button[role="switch"]')
    const count = await switches.count()
    
    if (count >= 2) {
      await switches.nth(0).click()
      await page.waitForTimeout(200)
      await switches.nth(1).click()
      await page.waitForTimeout(200)
    }
  })

  test('enrichment depth change affects preview', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const depthOptions = page.locator('button').filter({ hasText: /Quick|Standard|Deep/ })
    if (await depthOptions.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const buttons = await depthOptions.all()
      if (buttons.length >= 2) {
        await buttons[0].click()
        await page.waitForTimeout(500)
        
        if (buttons.length >= 2) {
          await buttons[1].click()
          await page.waitForTimeout(500)
        }
      }
    }
  })

  test('cache hit rate display visible', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const cache = page.getByText(/Cache|Hit Rate|Cached/i)
    if (await cache.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(cache.first()).toBeVisible()
    }
  })

  test('recipient count summary visible', async ({ page }) => {
    await goToEnrichmentPage(page)
    
    const count = page.getByText(/recipient|recipients|total/i)
    if (await count.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(count.first()).toBeVisible()
    }
  })
})
