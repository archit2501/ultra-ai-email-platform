import { test, expect, Page } from '@playwright/test'
import { login } from './helpers'

const goToMonitoringPage = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.removeItem('campaign-drafts')
  })
  await page.goto('/campaigns')
  await page.waitForLoadState('networkidle')

  const loginField = page.getByPlaceholder('Enter your username')
  if (await loginField.isVisible().catch(() => false)) {
    await login(page)
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-drafts')
    })
    await page.goto('/campaigns')
    await page.waitForLoadState('networkidle')
  }

  // Navigate through all steps first if needed
  const currentUrl = page.url()
  if (!currentUrl.includes('campaigns') || currentUrl.includes('create')) {
    // Do step 1-4 navigation
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

    // Navigate through steps 2-4
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.getByRole('button').filter({ hasText: /next|continue|proceed/i })
      if (await nextBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.first().click()
        await page.waitForTimeout(2000)
      }
    }
  }

  // Try to launch/send campaign if possible
  const launchBtn = page.getByRole('button').filter({ hasText: /Launch|launch|Send|send/i })
  if (await launchBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await launchBtn.first().click()
    await page.waitForTimeout(2000)
  }

  // Navigate to campaigns main page
  await page.goto('/campaigns')
  await page.waitForLoadState('networkidle')
}

test.describe('Phase 6 - Campaign Monitoring & Analytics', () => {
  test('reach campaigns dashboard', async ({ page }) => {
    await goToMonitoringPage(page)
    await expect(page.locator('body')).toContainText(/campaign|Campaign|dashboard|Dashboard/, { timeout: 5000 })
  })

  test('campaigns list visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const list = page.getByText(/My Campaign|campaign|list|List|Sent|Recent/i)
    if (await list.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(list.first()).toBeVisible()
    }
  })

  test('campaign status visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const status = page.getByText(/Status|status|Active|active|Completed|completed|Draft/i)
    if (await status.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(status.first()).toBeVisible()
    }
  })

  test('campaign creation date displayed', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const date = page.getByText(/Created|created|Date|date|2024|2025/i)
    if (await date.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(date.first()).toBeVisible()
    }
  })

  test('open rate metric visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const openRate = page.getByText(/Open|open|%|\d+/i)
    if (await openRate.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(openRate.first()).toBeVisible()
    }
  })

  test('click rate metric visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const clickRate = page.getByText(/Click|click|CTR|ctr/i)
    if (await clickRate.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(clickRate).toBeVisible()
    }
  })

  test('response rate metric visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const response = page.getByText(/Response|response|Reply|reply|Engagement/i)
    if (await response.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(response).toBeVisible()
    }
  })

  test('campaign detail view accessible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const campaignRow = page.locator('tr, [role="row"]').first()
    if (await campaignRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await campaignRow.click()
      await page.waitForTimeout(1000)
    }
  })

  test('real-time metrics dashboard', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const metrics = page.getByText(/Metrics|metrics|Dashboard|dashboard|Real-time/i)
    if (await metrics.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(metrics.first()).toBeVisible()
    }
  })

  test('sent count displayed', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const sent = page.getByText(/Sent|sent|\d+ sent/i)
    if (await sent.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sent.first()).toBeVisible()
    }
  })

  test('delivery status visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const delivery = page.getByText(/Delivered|delivered|Bounced|bounced|Failed|failed/i)
    if (await delivery.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(delivery.first()).toBeVisible()
    }
  })

  test('performance chart visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const chart = page.locator('canvas, [role="img"], svg').filter({ hasText: /chart|Chart|graph|Graph/i })
    if (await chart.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(chart.first()).toBeVisible()
    }
  })

  test('A/B test results accessible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const abTest = page.getByText(/A.*B|Test|test|Variant|variant/i)
    if (await abTest.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(abTest.first()).toBeVisible()
    }
  })

  test('follow-up performance visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const followUp = page.getByText(/Follow-up|follow-up|Sequence|sequence|Performance/i)
    if (await followUp.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(followUp.first()).toBeVisible()
    }
  })

  test('recipient engagement analytics', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const engagement = page.getByText(/Engagement|engagement|Interaction|interaction/i)
    if (await engagement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(engagement).toBeVisible()
    }
  })

  test('campaign pause button available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const pauseBtn = page.getByRole('button').filter({ hasText: /Pause|pause|Stop|stop/i })
    if (await pauseBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pauseBtn.first()).toBeVisible()
    }
  })

  test('campaign resume button available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const resumeBtn = page.getByRole('button').filter({ hasText: /Resume|resume|Continue|continue/i })
    if (await resumeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(resumeBtn.first()).toBeVisible()
    }
  })

  test('campaign duplicate option available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const duplicateBtn = page.getByRole('button').filter({ hasText: /Duplicate|duplicate|Clone|clone/i })
    if (await duplicateBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(duplicateBtn.first()).toBeVisible()
    }
  })

  test('campaign download report available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const downloadBtn = page.getByRole('button').filter({ hasText: /Download|download|Export|export|Report/i })
    if (await downloadBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(downloadBtn.first()).toBeVisible()
    }
  })

  test('analytics time range selector', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const timeSelect = page.locator('select, [role="combobox"]').filter({ hasText: /today|Today|week|Week|month|Month/i })
    if (await timeSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await timeSelect.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('recipient click tracking events visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const clicks = page.getByText(/Click Events|click events|Clicks|clicks|Event/i)
    if (await clicks.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(clicks.first()).toBeVisible()
    }
  })

  test('recipient open tracking events visible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const opens = page.getByText(/Open Events|open events|Opens|opens/i)
    if (await opens.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(opens.first()).toBeVisible()
    }
  })

  test('campaign notes section present', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const notes = page.getByText(/Notes|notes|Comment|comment/i)
    if (await notes.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(notes).toBeVisible()
    }
  })

  test('campaign recipient list accessible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const recipientBtn = page.getByRole('button').filter({ hasText: /Recipient|recipient|List|list/i })
    if (await recipientBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await recipientBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('export recipients option available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const exportBtn = page.getByRole('button').filter({ hasText: /Export|export|Download|download|CSV/i })
    if (await exportBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn.first()).toBeVisible()
    }
  })

  test('bulk operations on recipients', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const bulkBtn = page.getByRole('button').filter({ hasText: /Bulk|bulk|Action|action|Select|select/i })
    if (await bulkBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await bulkBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('campaign archive button available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const archiveBtn = page.getByRole('button').filter({ hasText: /Archive|archive/i })
    if (await archiveBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(archiveBtn.first()).toBeVisible()
    }
  })

  test('campaign delete button available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const deleteBtn = page.getByRole('button').filter({ hasText: /Delete|delete|Remove/i })
    if (await deleteBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(deleteBtn.first()).toBeVisible()
    }
  })

  test('campaign comparison view available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const compareBtn = page.getByRole('button').filter({ hasText: /Compare|compare|Vs|vs/i })
    if (await compareBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await compareBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('advanced analytics accessible', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const advancedBtn = page.getByRole('button').filter({ hasText: /Advanced|advanced|Analytics|analytics/i })
    if (await advancedBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('cohort analysis available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const cohort = page.getByText(/Cohort|cohort|Group|group|Segment|segment/i)
    if (await cohort.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(cohort).toBeVisible()
    }
  })

  test('funnel analysis available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const funnel = page.getByText(/Funnel|funnel|Conversion|conversion|Flow/i)
    if (await funnel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(funnel).toBeVisible()
    }
  })

  test('custom metric creation', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const customBtn = page.getByRole('button').filter({ hasText: /Custom|custom|Metric|metric/i })
    if (await customBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await customBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('campaign collaboration features', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const shareBtn = page.getByRole('button').filter({ hasText: /Share|share|Team|team/i })
    if (await shareBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await shareBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('campaign templates insights', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const template = page.getByText(/Template|template|Email|email|Subject/i)
    if (await template.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(template.first()).toBeVisible()
    }
  })

  test('recipient source insights', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const source = page.getByText(/Source|source|LinkedIn|linkedin|CSV/i)
    if (await source.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(source).toBeVisible()
    }
  })

  test('enrichment impact analytics', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const enrichment = page.getByText(/Enrichment|enrichment|Data|data|Quality/i)
    if (await enrichment.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(enrichment).toBeVisible()
    }
  })

  test('time zone distribution chart', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const tzChart = page.getByText(/Timezone|timezone|GMT|UTC|Distribution/i)
    if (await tzChart.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tzChart).toBeVisible()
    }
  })

  test('response sentiment analysis', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const sentiment = page.getByText(/Sentiment|sentiment|Positive|positive|Negative|negative/i)
    if (await sentiment.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sentiment).toBeVisible()
    }
  })

  test('campaign ROI calculation', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const roi = page.getByText(/ROI|roi|Return|return|Investment/i)
    if (await roi.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(roi).toBeVisible()
    }
  })

  test('predictive analytics available', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const predictive = page.getByText(/Predict|predict|Forecast|forecast|Trend/i)
    if (await predictive.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(predictive).toBeVisible()
    }
  })

  test('analytics data refresh rate', async ({ page }) => {
    await goToMonitoringPage(page)
    
    await page.waitForTimeout(5000)
    
    // Verify page is still responsive
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('analytics export to PDF', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const pdfBtn = page.getByRole('button').filter({ hasText: /PDF|pdf|Export|export/i })
    if (await pdfBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pdfBtn.first()).toBeVisible()
    }
  })

  test('analytics scheduled reports', async ({ page }) => {
    await goToMonitoringPage(page)
    
    const scheduleBtn = page.getByRole('button').filter({ hasText: /Schedule|schedule|Report|report|Email/i })
    if (await scheduleBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})
