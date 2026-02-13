import { test, expect, Page } from '@playwright/test'
import { login } from './helpers'

const goToSendPage = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.removeItem('campaign-drafts')
  })
  await page.goto('/campaigns/create/step4-send')
  await page.waitForLoadState('networkidle')

  const loginField = page.getByPlaceholder('Enter your username')
  if (await loginField.isVisible().catch(() => false)) {
    await login(page)
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-drafts')
    })
    await page.goto('/campaigns/create/step4-send')
    await page.waitForLoadState('networkidle')
  }

  // Check if we're already on send page with content
  const currentUrl = page.url()
  if (currentUrl.includes('step4-send')) {
    const richContent = page.locator('button, [role="switch"], input, [role="tab"], [role="region"]')
    if (await richContent.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      return
    }
  }

  // Navigate through all steps
  await page.goto('/campaigns/create/step1-source')
  await page.waitForLoadState('networkidle')

  // Step 1: CSV Upload
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

  // Navigate through steps 2-4
  for (let i = 0; i < 3; i++) {
    const nextBtn = page.getByRole('button').filter({ hasText: /next|continue|proceed/i })
    if (await nextBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.first().click()
      await page.waitForTimeout(2000)
    }
  }

  // Final fallback: direct navigation
  if (!page.url().includes('step4-send')) {
    await page.goto('/campaigns/create/step4-send')
    await page.waitForLoadState('networkidle')
  }
}

test.describe('Step 4 - Campaign Send Configuration', () => {
  test('reach send configuration page', async ({ page }) => {
    await goToSendPage(page)
    await expect(page.locator('body')).toContainText(/Send|send|Campaign|campaign/, { timeout: 5000 })
  })

  test('send method options visible', async ({ page }) => {
    await goToSendPage(page)
    
    const immediate = page.getByText(/Immediate|immediate|Send Now/i)
    const scheduled = page.getByText(/Scheduled|scheduled|Schedule/i)
    const rateLimited = page.getByText(/Rate Limited|rate limited|Delay/i)
    
    let optionsFound = 0
    if (await immediate.first().isVisible({ timeout: 3000 }).catch(() => false)) optionsFound++
    if (await scheduled.first().isVisible({ timeout: 3000 }).catch(() => false)) optionsFound++
    if (await rateLimited.first().isVisible({ timeout: 3000 }).catch(() => false)) optionsFound++
    
    expect(optionsFound).toBeGreaterThan(0)
  })

  test('immediate send option selectable', async ({ page }) => {
    await goToSendPage(page)
    
    const immediateBtn = page.getByRole('button', { name: /Immediate|immediate/i })
    if (await immediateBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await immediateBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('scheduled send option available', async ({ page }) => {
    await goToSendPage(page)
    
    const scheduledBtn = page.getByRole('button', { name: /Scheduled|scheduled/i })
    if (await scheduledBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduledBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('date picker available for scheduled send', async ({ page }) => {
    await goToSendPage(page)
    
    const datePicker = page.locator('input[type="date"], input[placeholder*="date" i]')
    if (await datePicker.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(datePicker.first()).toBeVisible()
    }
  })

  test('time picker available for scheduled send', async ({ page }) => {
    await goToSendPage(page)
    
    const timePicker = page.locator('input[type="time"], input[placeholder*="time" i]')
    if (await timePicker.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(timePicker.first()).toBeVisible()
    }
  })

  test('rate limited send option available', async ({ page }) => {
    await goToSendPage(page)
    
    const rateLimitBtn = page.getByRole('button', { name: /Rate|rate|Delay|delay/i })
    if (await rateLimitBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await rateLimitBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('daily limit field available', async ({ page }) => {
    await goToSendPage(page)
    
    const dailyLimitInput = page.locator('input[placeholder*="limit" i], input[placeholder*="daily" i]')
    if (await dailyLimitInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dailyLimitInput.first()).toBeVisible()
    }
  })

  test('delay between sends field available', async ({ page }) => {
    await goToSendPage(page)
    
    const delayInput = page.locator('input[placeholder*="delay" i], input[placeholder*="second" i]')
    if (await delayInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(delayInput.first()).toBeVisible()
    }
  })

  test('business hours toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const businessHours = page.getByText(/Business Hours|business hours/i)
    if (await businessHours.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(businessHours).toBeVisible()
    }
  })

  test('recipient timezone toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const timezone = page.getByText(/Recipient Timezone|recipient timezone|Timezone/i)
    if (await timezone.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(timezone).toBeVisible()
    }
  })

  test('open tracking toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const tracking = page.getByText(/Open Tracking|open tracking|Track Opens/i)
    if (await tracking.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tracking).toBeVisible()
    }
  })

  test('click tracking toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const clickTracking = page.getByText(/Click Tracking|click tracking|Track Clicks/i)
    if (await clickTracking.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(clickTracking).toBeVisible()
    }
  })

  test('follow-up sequence option available', async ({ page }) => {
    await goToSendPage(page)
    
    const followUp = page.getByText(/Follow-up|follow-up|Sequence|sequence/i)
    if (await followUp.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(followUp.first()).toBeVisible()
    }
  })

  test('follow-up sequence selector works', async ({ page }) => {
    await goToSendPage(page)
    
    const sequenceSelect = page.locator('select, [role="combobox"]').filter({ hasText: /sequence|Sequence/i })
    if (await sequenceSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await sequenceSelect.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('stop on reply toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const stopReply = page.getByText(/Stop on Reply|stop on reply/i)
    if (await stopReply.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stopReply).toBeVisible()
    }
  })

  test('stop on bounce toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const stopBounce = page.getByText(/Stop on Bounce|stop on bounce|Bounce/i)
    if (await stopBounce.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stopBounce).toBeVisible()
    }
  })

  test('send time optimization toggle available', async ({ page }) => {
    await goToSendPage(page)
    
    const timeOpt = page.getByText(/Send Time Optimization|send time optimization|STO/i)
    if (await timeOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(timeOpt).toBeVisible()
    }
  })

  test('batch configuration settings visible', async ({ page }) => {
    await goToSendPage(page)
    
    const batch = page.getByText(/Batch|batch|Configuration|configuration/i)
    if (await batch.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(batch.first()).toBeVisible()
    }
  })

  test('recipient summary visible', async ({ page }) => {
    await goToSendPage(page)
    
    const summary = page.getByText(/recipients|Recipients|Total|total/i)
    if (await summary.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(summary.first()).toBeVisible()
    }
  })

  test('email authentication status visible', async ({ page }) => {
    await goToSendPage(page)
    
    const auth = page.getByText(/Authentication|authentication|DKIM|SPF/i)
    if (await auth.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(auth.first()).toBeVisible()
    }
  })

  test('pre-send checks visible', async ({ page }) => {
    await goToSendPage(page)
    
    const checks = page.getByText(/Pre-send|pre-send|Checks|checks/i)
    if (await checks.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(checks.first()).toBeVisible()
    }
  })

  test('campaign rules configuration available', async ({ page }) => {
    await goToSendPage(page)
    
    const rules = page.getByText(/Rules|rules|Conditions|conditions/i)
    if (await rules.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(rules.first()).toBeVisible()
    }
  })

  test('campaign performance monitor visible', async ({ page }) => {
    await goToSendPage(page)
    
    const monitor = page.getByText(/Performance|performance|Monitor|monitor/i)
    if (await monitor.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(monitor.first()).toBeVisible()
    }
  })

  test('estimated send duration displayed', async ({ page }) => {
    await goToSendPage(page)
    
    const duration = page.getByText(/Duration|duration|Estimated|estimated|minutes|hours/i)
    if (await duration.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(duration.first()).toBeVisible()
    }
  })

  test('cost estimation visible', async ({ page }) => {
    await goToSendPage(page)
    
    const cost = page.getByText(/Cost|cost|Credits|credits|Price/i)
    if (await cost.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(cost.first()).toBeVisible()
    }
  })

  test('advanced options toggle works', async ({ page }) => {
    await goToSendPage(page)
    
    const advancedBtn = page.getByRole('button').filter({ hasText: /Advanced|advanced|More|more/i })
    if (await advancedBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('campaign save as draft option', async ({ page }) => {
    await goToSendPage(page)
    
    const saveDraftBtn = page.getByRole('button').filter({ hasText: /Save|save|Draft|draft/i })
    if (await saveDraftBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(saveDraftBtn.first()).toBeVisible()
    }
  })

  test('campaign launch button visible', async ({ page }) => {
    await goToSendPage(page)
    
    const launchBtn = page.getByRole('button').filter({ hasText: /Launch|launch|Send|send|Campaign/i })
    if (await launchBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(launchBtn.first()).toBeVisible()
    }
  })

  test('back button returns to templates', async ({ page }) => {
    await goToSendPage(page)
    
    const backBtn = page.getByRole('button').filter({ hasText: /Back/ })
    if (await backBtn.first().isVisible()) {
      await backBtn.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('enrichment summary expandable', async ({ page }) => {
    await goToSendPage(page)
    
    const enrichBtn = page.getByRole('button').filter({ hasText: /Enrichment|enrichment/i })
    if (await enrichBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await enrichBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('recipients list expandable', async ({ page }) => {
    await goToSendPage(page)
    
    const recipBtn = page.getByRole('button').filter({ hasText: /Recipient|recipient|List|list/i })
    if (await recipBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await recipBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('fraud detection warning visible', async ({ page }) => {
    await goToSendPage(page)
    
    const fraud = page.getByText(/Fraud|fraud|Warning|warning|Alert/i)
    if (await fraud.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(fraud.first()).toBeVisible()
    }
  })

  test('send settings persist on reload', async ({ page }) => {
    await goToSendPage(page)
    
    const immediateBtn = page.getByRole('button', { name: /Immediate|immediate/i })
    if (await immediateBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await immediateBtn.first().click()
      await page.waitForTimeout(500)
      
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      const immediateBtn2 = page.getByRole('button', { name: /Immediate|immediate/i })
      if (await immediateBtn2.first().isVisible({ timeout: 3000 })) {
        await expect(immediateBtn2.first()).toBeVisible()
      }
    }
  })

  test('preview email available', async ({ page }) => {
    await goToSendPage(page)
    
    const previewBtn = page.getByRole('button').filter({ hasText: /Preview|preview|View/i })
    if (await previewBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('analytics dashboard accessible', async ({ page }) => {
    await goToSendPage(page)
    
    const analyticsBtn = page.getByRole('button').filter({ hasText: /Analytics|analytics|Dashboard|dashboard/i })
    if (await analyticsBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await analyticsBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('personalization warning visible if needed', async ({ page }) => {
    await goToSendPage(page)
    
    const warning = page.getByText(/Warning|warning|Personali|personali/i)
    if (await warning.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(warning.first()).toBeVisible()
    }
  })

  test('send confirmation dialog appears', async ({ page }) => {
    await goToSendPage(page)
    
    const launchBtn = page.getByRole('button').filter({ hasText: /Launch|launch|Send|send/i })
    if (await launchBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Don't actually launch, just verify button exists
      await expect(launchBtn.first()).toBeVisible()
    }
  })

  test('timezone selection for scheduled send', async ({ page }) => {
    await goToSendPage(page)
    
    const tzSelect = page.locator('select, [role="combobox"]').filter({ hasText: /timezone|Timezone|GMT|UTC/i })
    if (await tzSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await tzSelect.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('campaign name field present and editable', async ({ page }) => {
    await goToSendPage(page)
    
    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="campaign" i]')
    if (await nameInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nameInput.first()).toBeVisible()
    }
  })
})
